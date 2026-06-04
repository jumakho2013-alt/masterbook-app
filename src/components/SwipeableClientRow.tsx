import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Phone, MessageCircle, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/theme';
import { ClientRow } from '@/src/components/ClientRow';
import { useClientStore } from '@/src/stores/useClientStore';
import { phoneForWhatsApp, normalizePhoneForLink } from '@/src/lib/sleepingClients';
import { useT } from '@/src/hooks/useT';
import type { Client } from '@/src/types';

interface SwipeableClientRowProps {
  client: Client;
  lastVisitDate?: string;
  onPress?: () => void;
}

/**
 * Swipeable обёртка для ClientRow. Свайп влево → 3 действия:
 *   • WhatsApp — открыть мессенджер с номером
 *   • Позвонить — tel: deep-link
 *   • Удалить — confirm-prompt и hard-delete
 *
 * UX-цель: -2 тапа на самые частые операции в списке клиентов.
 * Из ревью Маши: «Я хочу позвонить или открыть WhatsApp прямо из списка».
 */
export function SwipeableClientRow({ client, lastVisitDate, onPress }: SwipeableClientRowProps) {
  const { colors, typography: typo } = useTheme();
  const deleteClient = useClientStore((s) => s.deleteClient);
  const tr = useT();
  const swipeRef = useRef<Swipeable>(null);

  const closeSwipe = () => swipeRef.current?.close();

  const onWhatsApp = async () => {
    closeSwipe();
    Haptics.selectionAsync();
    const num = phoneForWhatsApp(client.phone);
    try {
      const appUrl = `whatsapp://send?phone=${num}`;
      const canOpen = await Linking.canOpenURL(appUrl);
      await Linking.openURL(canOpen ? appUrl : `https://wa.me/${num}`);
    } catch {
      Alert.alert('WhatsApp', tr('components.swipeWaFailed'));
    }
  };

  const onCall = async () => {
    closeSwipe();
    Haptics.selectionAsync();
    try {
      await Linking.openURL(`tel:${normalizePhoneForLink(client.phone)}`);
    } catch {
      Alert.alert(tr('components.swipeCallTitle'), tr('components.swipeCallFailed'));
    }
  };

  const onDelete = () => {
    closeSwipe();
    Alert.alert(
      tr('components.swipeDeleteTitle'),
      tr('components.swipeDeleteMessage', { name: client.name }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('common.delete'),
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteClient(client.id);
          },
        },
      ],
    );
  };

  const renderRightActions = () => (
    <View style={styles.actionsRow}>
      <Pressable
        onPress={onWhatsApp}
        accessibilityRole="button"
        accessibilityLabel="WhatsApp"
        style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
      >
        <MessageCircle size={20} color="#FFFFFF" />
        <Text style={[typo.small, { color: '#FFFFFF', marginTop: 4 }]}>{tr('components.swipeWaShort')}</Text>
      </Pressable>
      <Pressable
        onPress={onCall}
        accessibilityRole="button"
        accessibilityLabel={tr('components.call')}
        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
      >
        <Phone size={20} color="#FFFFFF" />
        <Text style={[typo.small, { color: '#FFFFFF', marginTop: 4 }]}>{tr('components.swipeCallShort')}</Text>
      </Pressable>
      <Pressable
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={tr('common.delete')}
        style={[styles.actionBtn, { backgroundColor: colors.danger }]}
      >
        <Trash2 size={20} color="#FFFFFF" />
        <Text style={[typo.small, { color: '#FFFFFF', marginTop: 4 }]}>{tr('common.delete')}</Text>
      </Pressable>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <View style={{ backgroundColor: colors.background }}>
        <ClientRow client={client} lastVisitDate={lastVisitDate} onPress={onPress} />
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
