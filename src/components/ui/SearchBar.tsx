import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Platform, type ReturnKeyTypeOptions } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useTheme } from '@/src/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmit?: () => void;
  accessibilityLabel?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Поиск...',
  autoFocus,
  returnKeyType = 'search',
  onSubmit,
  accessibilityLabel = 'Поле поиска',
}: SearchBarProps) {
  const { colors, typography: typo, borderRadius: br } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderRadius: br.md,
        },
      ]}
    >
      <Search size={18} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, typo.body, { color: colors.text }]}
        autoCorrect={false}
        autoCapitalize="none"
        // iOS: native "clear button" when text is entered; we still render a
        // cross-platform clear button below so Android matches.
        clearButtonMode={Platform.OS === 'ios' ? 'never' : undefined}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmit}
        keyboardAppearance="default"
        autoFocus={autoFocus}
        accessibilityLabel={accessibilityLabel}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Очистить поиск"
          style={styles.clearBtn}
        >
          <X size={16} color={colors.textTertiary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
