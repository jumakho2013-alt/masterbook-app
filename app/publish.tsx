import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from '@/src/lib/haptics';
import { ArrowLeft, Globe, Copy, AlertCircle, ImagePlus, X } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Button, IconButton, CustomAlert, useToast } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useT } from '@/src/hooks/useT';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useServiceStore } from '@/src/stores/useServiceStore';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { makeSlug } from '@/src/utils/slug';
import { COUNTRIES, countryByName, countryOfCity, DEFAULT_COUNTRY } from '@/src/data/geo';
import { pushPublicProfile } from '@/src/lib/cloudSync';
import { uploadPortfolioPhoto, deletePortfolioPhoto } from '@/src/lib/portfolioCloud';

const MAX_PHOTOS = 12;

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
  const setMasterName = useSettingsStore((s) => s.setMasterName);
  const setPublicProfile = useSettingsStore((s) => s.setPublicProfile);
  const slug0 = useSettingsStore((s) => s.slug);
  const servicesCount = useServiceStore((s) => s.services.length);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const localOnly = useAuthStore((s) => s.localOnlyMode);
  const needAccount = !userId || localOnly;

  const [city, setCity] = useState(useSettingsStore.getState().city);
  const [countrySel, setCountrySel] = useState(
    countryOfCity(useSettingsStore.getState().city) || DEFAULT_COUNTRY,
  );
  const [district, setDistrict] = useState(useSettingsStore.getState().district);
  const [whatsapp, setWhatsapp] = useState(useSettingsStore.getState().whatsapp);
  const [phone, setPhone] = useState(useSettingsStore.getState().publicPhone);
  const [bio, setBio] = useState(useSettingsStore.getState().bio);
  const [published, setPublished] = useState(useSettingsStore.getState().published);
  const [photos, setPhotos] = useState<string[]>(useSettingsStore.getState().portfolioPhotos);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Коммит фото — на «Сохранить». Удаляем из бакета (а не сразу при тапе X),
  // иначе уход без сохранения оставил бы в БД ссылку на уже удалённый файл →
  // битая картинка на сайте. На успешном сейве чистим: всё, что было в БД или
  // залито в эту сессию, но не попало в финальный список.
  const initialPhotos = useRef(useSettingsStore.getState().portfolioPhotos);
  const uploadedThisSession = useRef<Set<string>>(new Set());

  const addPhotos = async () => {
    if (photos.length >= MAX_PHOTOS) {
      toast.error(tr('settings.publishPhotoLimit'));
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showError(tr('settings.publishPhotoPermTitle'), tr('settings.publishPhotoPermBody'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 1, // финальное сжатие делает manipulateAsync в portfolioCloud
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    const uploaded: string[] = [];
    for (const asset of result.assets) {
      const u = await uploadPortfolioPhoto(asset.uri);
      if (u) {
        uploaded.push(u);
        uploadedThisSession.current.add(u);
      }
    }
    setUploading(false);

    if (uploaded.length) {
      setPhotos((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS));
      Haptics.selectionAsync();
    }
    if (uploaded.length < result.assets.length) {
      toast.error(tr('settings.publishPhotoError'));
    }
  };

  const removePhoto = (urlDel: string) => {
    Haptics.selectionAsync();
    setPhotos((prev) => prev.filter((p) => p !== urlDel));
  };

  const reqs = [
    !masterName.trim() && tr('settings.publishReqName'),
    !city.trim() && tr('settings.publishReqCity'),
    servicesCount === 0 && tr('settings.publishReqService'),
  ].filter(Boolean) as string[];
  const canPublish = reqs.length === 0;

  const slug = slug0 ?? makeSlug(masterName);
  // Сайт отдаёт профиль по /m/<slug> (web/app/m/[slug]) — ссылка должна совпадать.
  const url = `${SITE_DOMAIN}/m/${slug}`;

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
    setPublicProfile({ city: city.trim(), district: district.trim(), bio: bio.trim(), whatsapp: whatsapp.trim(), publicPhone: phone.trim(), portfolioPhotos: photos, published, slug: nextSlug });
    const res = await pushPublicProfile();
    setSaving(false);
    if (!res.ok) {
      showError(tr('settings.publishSaveError'));
      return;
    }
    // Сейв удался → подчищаем бакет: всё, что было раньше или залито в сессию,
    // но не осталось в финальном списке (удалённые + добавленные-и-убранные).
    const keep = new Set(photos);
    const stale = [...new Set([...initialPhotos.current, ...uploadedThisSession.current])].filter((u) => !keep.has(u));
    stale.forEach((u) => void deletePortfolioPhoto(u));
    initialPhotos.current = photos;
    uploadedThisSession.current = new Set();
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
          {/* Бесшовный апгрейд: регистрация сбрасывает localOnly → синк сам
              переносит все локальные данные в облако (см. useAuthStore.signUp). */}
          <Button
            title={tr('auth.register')}
            onPress={() => router.push('/(auth)/register')}
            size="lg"
            fullWidth
            style={{ marginTop: 24 }}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
          <Text style={[typo.body, { color: colors.textSecondary, lineHeight: 22, marginBottom: sp.lg }]}>
            {tr('settings.publishIntro')}
          </Text>

          {/* Имя / название (редактируемое — раньше менялось только в онбординге) */}
          <Text style={[typo.label, { color: colors.textTertiary, marginBottom: 6 }]}>{tr('settings.publishName')}</Text>
          <TextInput
            value={masterName}
            onChangeText={setMasterName}
            placeholder={tr('settings.publishNamePlaceholder')}
            placeholderTextColor={colors.textTertiary}
            maxLength={80}
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md, marginBottom: sp.md }]}
          />

          {/* Страна — сужает список городов */}
          <Text style={[typo.label, { color: colors.textTertiary, marginBottom: 6 }]}>{tr('settings.publishCountry')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
            {COUNTRIES.map((c) => {
              const active = c.name === countrySel;
              return (
                <Pressable key={c.code} onPress={() => { Haptics.selectionAsync(); setCountrySel(c.name); }}
                  style={[styles.geoChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: br.md }]}>
                  <Text style={[typo.caption, { color: active ? colors.white : colors.text }]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Город — тап по чипу = каноничное имя (важно для фильтра каталога) */}
          <Text style={[typo.label, { color: colors.textTertiary, marginTop: sp.md, marginBottom: 6 }]}>{tr('settings.publishCity')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 2 }}>
            {(countryByName(countrySel)?.cities ?? []).map((ct) => {
              const active = ct === city;
              return (
                <Pressable key={ct} onPress={() => { Haptics.selectionAsync(); setCity(ct); }}
                  style={[styles.geoChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border, borderRadius: br.md }]}>
                  <Text style={[typo.caption, { color: active ? colors.white : colors.text }]}>{ct}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder={tr('settings.publishCityPlaceholder')}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, typo.body, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br.md, marginTop: 8 }]}
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

          {/* Фото-портфолио — публичный бакет, на сайте показывается галереей */}
          <Text style={[typo.label, { color: colors.textTertiary, marginTop: sp.md, marginBottom: 4 }]}>{tr('settings.publishPhotos')}</Text>
          <Text style={[typo.small, { color: colors.textTertiary, marginBottom: 10 }]}>{tr('settings.publishPhotosHint')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 2 }}>
            {photos.map((p) => (
              <View key={p} style={styles.photoWrap}>
                <Image source={{ uri: p }} style={[styles.photo, { borderRadius: br.md }]} contentFit="cover" transition={150} />
                <Pressable
                  onPress={() => removePhoto(p)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={tr('common.delete')}
                  style={[styles.photoRemove, { backgroundColor: colors.text }]}
                >
                  <X size={13} color={colors.white} />
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable
                onPress={addPhotos}
                disabled={uploading}
                accessibilityRole="button"
                accessibilityLabel={tr('settings.publishPhotos')}
                style={[styles.photoAdd, { borderColor: colors.border, borderRadius: br.md, backgroundColor: colors.surface }]}
              >
                {uploading ? <ActivityIndicator color={colors.primary} /> : <ImagePlus size={24} color={colors.textTertiary} />}
              </Pressable>
            )}
          </ScrollView>

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
  geoChip: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 8 },
  photoWrap: { width: 92, height: 92 },
  photo: { width: 92, height: 92 },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  photoAdd: { width: 92, height: 92, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  reqs: { padding: 14, marginTop: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, padding: 16, marginTop: 20 },
  urlBox: { padding: 16, marginTop: 12 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
});
