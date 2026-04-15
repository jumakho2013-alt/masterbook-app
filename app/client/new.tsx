import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/src/theme';
import { Button, Input, IconButton, CustomAlert } from '@/src/components/ui';
import { useAlert } from '@/src/hooks/useAlert';
import { useClientStore } from '@/src/stores/useClientStore';

export default function NewClientScreen() {
  const router = useRouter();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const addClient = useClientStore((s) => s.addClient);
  const clientCount = useClientStore((s) => s.clients.length);

  const { alertConfig, error: showError } = useAlert();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const onSubmit = () => {
    Keyboard.dismiss();
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = 'Введите имя';
    if (!phone.trim() || phone.trim().length < 5) newErrors.phone = 'Введите телефон';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (clientCount >= 20) {
      showError('Лимит', 'В бесплатном плане максимум 20 клиентов. Перейдите на PRO.');
      return;
    }

    addClient({
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      address: address.trim() || undefined,
      tags: ['new'],
    });
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton icon={<ArrowLeft size={22} color={colors.text} />} onPress={() => router.back()} variant="ghost" />
        <Text style={[typo.h3, { color: colors.text }]}>Новый клиент</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Input
          label="Имя"
          placeholder="Мария Иванова"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
          error={errors.name}
          autoFocus
        />
        <Input
          label="Телефон"
          placeholder="+7 (916) 123-45-67"
          value={phone}
          onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: undefined })); }}
          error={errors.phone}
          keyboardType="phone-pad"
        />
        <Input
          label="Адрес (необязательно)"
          placeholder="ул. Ленина, д. 5, кв. 12"
          value={address}
          onChangeText={setAddress}
        />
        <Input
          label="Заметки (необязательно)"
          placeholder="Любит матовый топ..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button
          title="Сохранить"
          onPress={onSubmit}
          size="lg"
          fullWidth
          style={{ marginTop: sp.lg }}
        />
      </ScrollView>
      <CustomAlert {...alertConfig} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  form: {
    padding: 24,
    gap: 16,
  },
});
