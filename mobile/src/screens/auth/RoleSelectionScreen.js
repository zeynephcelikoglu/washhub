import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants/authTheme';

const RoleSelectionScreen = ({ navigation }) => {
  const roles = [
    {
      id: 'user',
      title: 'Müşteri',
      description: 'Çamaşırlarımı yıkatmak istiyorum',
      icon: 'person-outline',
      color: COLORS.customer,
      colorLight: COLORS.primaryLight,
    },
    {
      id: 'owner',
      title: 'İşletme Sahibi',
      description: 'Çamaşırhanemi yönetmek istiyorum',
      icon: 'storefront-outline',
      color: COLORS.owner,
      colorLight: '#FFF3E0',
    },
    {
      id: 'courier',
      title: 'Kurye',
      description: 'Teslimat yapmak istiyorum',
      icon: 'bicycle-outline',
      color: COLORS.courier,
      colorLight: '#E8F5E9',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>WashHub</Text>
          <Text style={styles.subtitle}>Çamaşır Yıkama Hizmetleri</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={[styles.roleCard, { borderColor: role.color }]}
              onPress={() => navigation.navigate('Login', { role: role.id })}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: role.colorLight },
                ]}
              >
                <Ionicons name={role.icon} size={32} color={role.color} />
              </View>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: 90,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.label.fontSize,
    fontWeight: '500',
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  rolesContainer: {
    gap: SPACING.lg,
  },
  roleCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  roleTitle: {
    fontSize: TYPOGRAPHY.h3.fontSize,
    fontWeight: TYPOGRAPHY.h3.fontWeight,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default RoleSelectionScreen;
