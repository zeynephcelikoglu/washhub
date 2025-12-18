import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  getRoleColor,
  getRoleName,
} from '../../constants/authTheme';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { signIn } = useContext(AuthContext);
  const role = route.params?.role || 'user';
  const roleColor = getRoleColor(role);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen email ve şifreyi girin');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password, role);
    } catch (error) {
      Alert.alert('Giriş Hatası', error.message || 'Giriş başarısız');
    }
    setLoading(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.title}>Hoş Geldiniz</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
      </View>

      <View
        style={[
          styles.roleBadge,
          { backgroundColor: roleColor.light },
        ]}
      >
        <Ionicons
          name={role === 'user' ? 'person' : role === 'owner' ? 'storefront' : 'bicycle'}
          size={14}
          color={roleColor.main}
        />
        <Text
          style={[
            styles.roleBadgeText,
            { color: roleColor.main },
          ]}
        >
          Rol: {getRoleName(role)}
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View
            style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor={COLORS.textPlaceholder}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Şifre</Text>
          <View
            style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi girin"
              placeholderTextColor={COLORS.textPlaceholder}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              editable={!loading}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.cardBackground} />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Hesabınız yok mu?</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Register', { role })}
        >
          <Text style={styles.linkText}>Kayıt Olun</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: SPACING.xxxl,
  },
  title: {
    fontSize: TYPOGRAPHY.h2.fontSize,
    fontWeight: TYPOGRAPHY.h2.fontWeight,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.caption.fontSize,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xxxl,
  },
  roleBadgeText: {
    fontSize: TYPOGRAPHY.label.fontSize,
    fontWeight: TYPOGRAPHY.label.fontWeight,
    marginLeft: SPACING.sm,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.label.fontSize,
    fontWeight: TYPOGRAPHY.label.fontWeight,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.sm,
  },
  inputWrapperFocused: {
    borderColor: COLORS.borderFocus,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: TYPOGRAPHY.body.fontSize,
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    padding: SPACING.sm,
  },
  button: {
    height: 56,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.button.fontSize,
    fontWeight: TYPOGRAPHY.button.fontWeight,
    color: COLORS.cardBackground,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.body.fontSize,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: TYPOGRAPHY.bodyBold.fontSize,
    fontWeight: TYPOGRAPHY.bodyBold.fontWeight,
    color: COLORS.primary,
    marginTop: SPACING.sm,
  },
});

export default LoginScreen;
