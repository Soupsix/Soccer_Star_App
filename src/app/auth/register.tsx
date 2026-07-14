import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/services/firebase';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Tên quá ngắn')
    .max(50, 'Tên quá dài')
    .required('Vui lòng nhập tên của bạn'),
  email: Yup.string()
    .email('Địa chỉ email không hợp lệ')
    .required('Vui lòng nhập email'),
  phone: Yup.string()
    .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ (Ví dụ: 0912345678)')
    .required('Vui lòng nhập số điện thoại'),
  password: Yup.string()
    .min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự')
    .required('Vui lòng nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Mật khẩu xác nhận không trùng khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

export default function RegisterScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (values: any, { setSubmitting }: any) => {
    setErrorMsg(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // Update display name
      await updateProfile(user, {
        displayName: values.name,
      });

      // Save user profile & phone number to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: values.name,
        email: values.email,
        phone: values.phone,
        createdAt: new Date().toISOString(),
      });

      // Redirect to main app
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error(err);
      let message = 'Đã xảy ra lỗi đăng ký tài khoản. Vui lòng thử lại.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'Địa chỉ email này đã được đăng ký sử dụng.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Địa chỉ email không hợp lệ.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Mật khẩu của bạn quá yếu.';
      }
      setErrorMsg(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <IconSymbol size={24} name="chevron.left.forwardslash.chevron.right" color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
              Đăng Ký
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: '#A0AEC0' }]}>
              Tạo tài khoản Soccer Star để bắt đầu dự đoán và nhận phần thưởng
            </ThemedText>
          </View>

          {/* Form */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {errorMsg && (
              <View style={[styles.errorContainer, { backgroundColor: '#FF4D4F' + '20' }]}>
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </View>
            )}

            <Formik
              initialValues={{ name: '', email: '', phone: '', password: '', confirmPassword: '' }}
              validationSchema={RegisterSchema}
              onSubmit={handleRegister}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isSubmitting,
              }) => (
                <View style={styles.form}>
                  {/* Name Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>TÊN HIỂN THỊ</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="Nguyễn Văn A"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        autoCapitalize="words"
                        onChangeText={handleChange('name')}
                        onBlur={handleBlur('name')}
                        value={values.name}
                      />
                    </View>
                    {touched.name && errors.name && (
                      <ThemedText style={styles.validationError}>{errors.name}</ThemedText>
                    )}
                  </View>

                  {/* Email Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>EMAIL</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="example@email.com"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={handleChange('email')}
                        onBlur={handleBlur('email')}
                        value={values.email}
                      />
                    </View>
                    {touched.email && errors.email && (
                      <ThemedText style={styles.validationError}>{errors.email}</ThemedText>
                    )}
                  </View>

                  {/* Phone Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>SỐ ĐIỆN THOẠI</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="0912345678"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={handleChange('phone')}
                        onBlur={handleBlur('phone')}
                        value={values.phone}
                      />
                    </View>
                    {touched.phone && errors.phone && (
                      <ThemedText style={styles.validationError}>{errors.phone}</ThemedText>
                    )}
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>MẬT KHẨU</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                        value={values.password}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                      >
                        <IconSymbol
                          size={20}
                          name="house.fill"
                          color="#A0AEC0"
                        />
                      </TouchableOpacity>
                    </View>
                    {touched.password && errors.password && (
                      <ThemedText style={styles.validationError}>{errors.password}</ThemedText>
                    )}
                  </View>

                  {/* Confirm Password Field */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU</ThemedText>
                    <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor="#64748B"
                        style={[styles.input, { color: colors.text }]}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={handleChange('confirmPassword')}
                        onBlur={handleBlur('confirmPassword')}
                        value={values.confirmPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeBtn}
                      >
                        <IconSymbol
                          size={20}
                          name="house.fill"
                          color="#A0AEC0"
                        />
                      </TouchableOpacity>
                    </View>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <ThemedText style={styles.validationError}>{errors.confirmPassword}</ThemedText>
                    )}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleSubmit()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.submitBtnText}>ĐĂNG KÝ TÀI KHOẢN</ThemedText>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </Formik>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={{ color: '#A0AEC0' }}>Đã có tài khoản? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <ThemedText style={[styles.linkText, { color: colors.primary, fontWeight: 'bold' }]}>
                Đăng nhập
              </ThemedText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF4D4F',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A0AEC0',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
  },
  eyeBtn: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  validationError: {
    color: '#FF4D4F',
    fontSize: 12,
    marginTop: 6,
  },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2F80ED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  linkText: {
    fontSize: 14,
  },
});
