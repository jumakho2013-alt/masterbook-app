import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Globe, Copy, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Button, IconButton, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { makeSlug } from '@/src/utils/slug';
import { pushPublicProfile } from '@/src/lib/cloudSync';

// Рабочий домен сайта-каталога. Имя поменяем перед публичным запуском —
// это единственное место, где оно зашито для предпросмотра ссылки.
const SITE_DOMAIN = 'masterbook.tj';

export default function PublishScreen() {
  const router = useRouter();
  const tr = useT();
  const { colors, typography: typo, spacing: sp, borderRadius: br } = useTheme();
  const toast = useToast();
  const { alertConfig, error: showError } = useAlert();

  const masterName = useSettingsStore((s) => s.masterName);
  const setPublicProfile = useSettingsStore((s) => s.setPublicProfile);
  const slug0 = useSettingsStore((s) => s.slug);
  const servicesCount = useServiceStore((s) => s.services.length);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const localOnly = useAuthStore((s) => s.localOnlyMode);
  const needAccount = !userId || localOnly;

  const [city, setCity] = useState(useSettingsStore.getState().city);
  const [district, setDistrict] = useState(useSettingsStore.getState().district);
  const [whatsapp, setWhatsapp] = useState(useSettingsStore.getState().whatsapp);
  const [phone, setPhone] = useState(useSettingsStore.getState().publicPhone);
  const [bio, setBio] = useState(useSettingsStore.getState().bio);
  const [published, setPublished] = useState(useSettingsStore.getState().published);
  const [saving, setSaving] = useState(false);

  const reqs = [
    !masterName.trim() && tr('settings.publishReqName'),
    !city.trim() && tr('settings.publishReqCity'),
    servicesCount === 0 && tr('settings.publishReqService'),
  ].filter(Boolean) as string[];
  const canPublish = reqs.length === 0;

  const slug = slug0 ?? makeSlug(masterName);
  const url = `${SITE_DOMAIN}/${slug}`;

  const onToggle = (v: boolean) => {
    if (v && !canPublish) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.selectionAsync();
    setPublished(v);
  };

  const onSave = async () => {
    if (published && !canPublish) {
      showError(tr('settings.publishReqTitle'), reqs.join('\n'));
      return;
    }
    setSaving(true);
    const nextSlug = published ? (slug0 ?? makeSlug(masterName)) : slug0;
    setPublicProfile({ city: city.trim(), district: district.trim(), bio: bio.trim(), whatsapp: whatsapp.trim(), publicPhone: phone.trim(), published, slug: nextSlug });
    const res = await pushPublicProfile();
    setSaving(false);
    if (!res.ok) {
      showError(tr('settings.publishSaveError'));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(tr('settings.publishSaved'));
    router.back();
  };

  const copyUrl = async () => {
    await Clipboard.setStringAsync(`https://${url}`);
    Haptics.selectionAsync();
    toast.success(tr('settings.publishCopied'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>{tr('settings.publishTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      {needAccount ? (
        <View style={styles.needAccount}>
          <Globe size={40} color={colors.textTertiary} />
          <Text style={[typo.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 22 }]}>
            {tr('settings.publishNeedAccount')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <Text style={[typo.body, { color: colors.textSecondary, lineHeight: 22, marginBottom: sp.lg }]}>
            {tr('settings.publishIntro')}
          </Text>

          {/* Город */}
          <Text style={[typo.label, { color: colors.textTertiary, marginBottom: 6 }]}>{tr('settings.publishCity')}</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder={tr('settings.publishCityPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md }]}
          />

          {/* Район */}
          <Text style={[typo.label, { color: colors.textTertiary, marginTop: sp.md, marginBottom: 6 }]}>{tr('settings.publishDistrict')}</Text>
          <TextInput
            value={district}
            onChangeText={setDistrict}
            placeholder={tr('settings.publishDistrictPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md }]}
          />

          {/* WhatsApp / телефон для кнопки «Записаться» на сайте */}
          <Text style={[typo.label, { color: colors.textTertiary, marginTop: sp.md, marginBottom: 6 }]}>{tr('settings.publishWhatsapp')}</Text>
          <TextInput
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder={tr('settings.publishWhatsappPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md }]}
          />
          <Text style={[typo.label, { color: colors.textTertiary, marginTop: sp.md, marginBottom: 6 }]}>{tr('settings.publishPhone')}</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder={tr('settings.publishPhonePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md }]}
          />

          {/* О себе */}
          <Text style={[typo.label, { color: colors.textTertiary, marginTop: sp.md, marginBottom: 6 }]}>{tr('settings.publishBio')}</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder={tr('settings.publishBioPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            multiline
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md, minHeight: 96, textAlignVertical: 'top' }]}
          />

          {/* Требования перед публикацией */}
          {!canPublish && (
            <View style={[styles.reqs, { backgroundColor: colors.warningSoft, borderRadius: br.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <AlertCircle size={16} color={colors.warning} />
                <Text style={[typo.caption, { color: colors.text, fontFamily: 'Manrope_700Bold' }]}>{tr('settings.publishReqTitle')}</Text>
              </View>
              {reqs.map((r) => (
                <Text key={r} style={[typo.caption, { color: colors.textSecondary, marginLeft: 24 }]}>• {r}</Text>
              ))}
            </View>
          )}

          {/* Переключатель публикации */}
          <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[typo.bodyBold, { color: colors.text }]}>{tr('settings.publishToggle')}</Text>
              <Text style={[typo.small, { color: colors.textTertiary, marginTop: 2 }]}>
                {published ? tr('settings.publishToggleOn') : tr('settings.publishToggleOff')}
              </Text>
            </View>
            <Switch
              value={published}
              onValueChange={onToggle}
              disabled={!canPublish && !published}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>

          {/* Ссылка на страницу */}
          {published && (
            <View style={[styles.urlBox, { backgroundColor: colors.primarySoft, borderRadius: br.md }]}>
              <Text style={[typo.label, { color: colors.primary }]}>{tr('settings.publishUrlLabel')}</Text>
              <Pressable onPress={copyUrl} accessibilityRole="button" style={styles.urlRow}>
                <Text style={[typo.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>{url}</Text>
                <Copy size={18} color={colors.primary} />
              </Pressable>
              <Text style={[typo.small, { color: colors.textTertiary, marginTop: 6 }]}>{tr('settings.publishUrlNote')}</Text>
            </View>
          )}

          <Button
            title={tr('common.save')}
            onPress={onSave}
            loading={saving}
            size="lg"
            fullWidth
            style={{ marginTop: sp.lg }}
          />
        </ScrollView>
      )}
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 4 },
  needAccount: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, marginTop: -40 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12 },
  reqs: { padding: 14, marginTop: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, padding: 16, marginTop: 20 },
  urlBox: { padding: 16, marginTop: 12 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
});
