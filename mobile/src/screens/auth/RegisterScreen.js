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

const RegisterScreen = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { signUp } = useContext(AuthContext);
  const role = route.params?.role || 'user';
  const roleColor = getRoleColor(role);

  const handleRegister = async () => {
    if (!name || !email || !password || !phone) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır');
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password, phone, role);
      setLoading(false);
      Alert.alert('Başarılı', 'Kayıt başarılı. Lütfen giriş yapın.');
      navigation.navigate('Login', { role });
      return;
    } catch (error) {
      setLoading(false);
      Alert.alert('Kayıt Hatası', error.message || 'Kayıt başarısız');
    }
  };

  const renderInput = (label, value, onChangeText, keyboardType = 'default', autoCapitalize = 'sentences', fieldName = null, isSecure = false) => {
    const isFocused = focusedField === fieldName;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder={label}
            placeholderTextColor={COLORS.textPlaceholder}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocusedField(fieldName)}
            onBlur={() => setFocusedField(null)}
            editable={!loading}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={isSecure && !showPassword}
          />
          {isSecure && (
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
          )}
        </View>
      </View>
    );
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
        <Text style={styles.title}>Hesap Oluştur</Text>
        <Text style={styles.subtitle}>Hemen başlayalım</Text>
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
        <Text style={styles.sectionHeader}>Kişisel Bilgiler</Text>

        {renderInput('Ad Soyad', name, setName, 'default', 'words', 'name')}
        {renderInput(
          'Email',
          email,
          setEmail,
          'email-address',
          'none',
          'email'
        )}
        {renderInput(
          'Telefon',
          phone,
          setPhone,
          'phone-pad',
          'none',
          'phone'
        )}

        {renderInput(
          'Şifre',
          password,
          setPassword,
          'default',
          'none',
          'password',
          true
        )}

        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.cardBackground} />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login', { role })}>
          <Text style={styles.linkText}>Giriş Yapın</Text>
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
    marginBottom: SPACING.lg,
  },
  roleBadgeText: {
    fontSize: TYPOGRAPHY.label.fontSize,
    fontWeight: TYPOGRAPHY.label.fontWeight,
    marginLeft: SPACING.sm,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.label.fontSize,
    fontWeight: TYPOGRAPHY.label.fontWeight,
    color: COLORS.textPrimary,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
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
    marginTop: SPACING.xl,
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

export default RegisterScreen;
