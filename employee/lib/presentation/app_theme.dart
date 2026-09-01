import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

extension ThemeExtension on BuildContext {
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
  Color get surfaceColor => isDarkMode ? AppTheme.surfaceDark : AppTheme.surfaceLight;
  Color get backgroundColor => isDarkMode ? AppTheme.backgroundDark : AppTheme.backgroundLight;
  Color get cardColor => isDarkMode ? AppTheme.cardDark : AppTheme.cardLight;
  Color get textPrimaryColor => isDarkMode ? AppTheme.textPrimaryDark : AppTheme.textPrimaryLight;
  Color get textSecondaryColor => isDarkMode ? AppTheme.textSecondaryDark : AppTheme.textSecondaryLight;
  Color get textMutedColor => isDarkMode ? AppTheme.textMutedDark : AppTheme.textMutedLight;
  Color get borderSubtleColor => isDarkMode ? AppTheme.borderDark : AppTheme.borderLight;
}

/// Centralized design system for the Field Sales app.
/// Focus on clarity, high contrast, and outdoor visibility.
class AppTheme {
  AppTheme._();

  // ─── Primary Colors ───────────────────────────────────────────
  static const Color primaryBlue = Color(0xFF0052CC); // Strong, reliable corporate blue
  static const Color primaryBlueDark = Color(0xFF0043A6);
  static const Color primaryBlueLight = Color(0xFFDEEBFF);
  
  static const Color successGreen = Color(0xFF00875A);
  static const Color warningOrange = Color(0xFFFF991F);
  static const Color dangerRed = Color(0xFFDE350B);

  // ─── Light Mode Colors ─────────────────────────────────────────
  static const Color backgroundLight = Color(0xFFF4F5F7);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color borderLight = Color(0xFFDFE1E6);

  static const Color textPrimaryLight = Color(0xFF172B4D);
  static const Color textSecondaryLight = Color(0xFF42526E);
  static const Color textMutedLight = Color(0xFF7A869A);

  // ─── Dark Mode Colors ──────────────────────────────────────────
  static const Color backgroundDark = Color(0xFF121212);
  static const Color surfaceDark = Color(0xFF1E1E1E);
  static const Color cardDark = Color(0xFF232323);
  static const Color borderDark = Color(0xFF333333);

  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFB3BAC5);
  static const Color textMutedDark = Color(0xFF8F9AAB);

  // ─── Text Styles ──────────────────────────────────────────────
  static TextStyle get headingLarge => GoogleFonts.inter(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.5,
      );

  static TextStyle get headingMedium => GoogleFonts.inter(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
      );

  static TextStyle get headingSmall => GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
      );

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
      );

  static TextStyle get bodySmall => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      );

  static TextStyle get buttonText => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
      );

  // ─── Shadows ──────────────────────────────────────────────────
  static List<BoxShadow> get subtleShadow => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.05),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ];

  // ─── Input Decoration ─────────────────────────────────────────
  static InputDecoration inputDecoration({
    required String label,
    IconData? icon,
    String? hint,
    BuildContext? context,
  }) {
    final isDark = context != null ? context.isDarkMode : false;
    final fillClr = isDark ? const Color(0xFF2A2A2A) : const Color(0xFFF4F5F7);
    final borderClr = isDark ? borderDark : borderLight;
    final labelClr = isDark ? textSecondaryDark : textSecondaryLight;

    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: GoogleFonts.inter(color: labelClr, fontSize: 16),
      hintStyle: GoogleFonts.inter(color: isDark ? textMutedDark : textMutedLight, fontSize: 16),
      prefixIcon: icon != null ? Icon(icon, color: isDark ? textMutedDark : textSecondaryLight) : null,
      filled: true,
      fillColor: fillClr,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderClr),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: borderClr),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: primaryBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: dangerRed, width: 2),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: dangerRed, width: 2),
      ),
    );
  }

  // ─── Button Styles ─────────────────────────────────────────────
  static ButtonStyle get primaryButton => ElevatedButton.styleFrom(
        backgroundColor: primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 16),
        textStyle: buttonText,
      );

  // ─── Theme Data ───────────────────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: primaryBlue,
        secondary: primaryBlueDark,
        surface: surfaceLight,
        error: dangerRed,
      ),
      textTheme: TextTheme(
        headlineLarge: headingLarge.copyWith(color: textPrimaryLight),
        headlineMedium: headingMedium.copyWith(color: textPrimaryLight),
        headlineSmall: headingSmall.copyWith(color: textPrimaryLight),
        bodyLarge: bodyLarge.copyWith(color: textPrimaryLight),
        bodyMedium: bodyMedium.copyWith(color: textSecondaryLight),
        bodySmall: bodySmall.copyWith(color: textMutedLight),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceLight,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: headingSmall.copyWith(color: textPrimaryLight),
        iconTheme: const IconThemeData(color: textPrimaryLight),
      ),
      cardTheme: CardThemeData(
        color: cardLight,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderLight),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: textPrimaryLight,
        contentTextStyle: bodyMedium.copyWith(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: primaryBlue,
        secondary: primaryBlueLight,
        surface: surfaceDark,
        error: dangerRed,
      ),
      textTheme: TextTheme(
        headlineLarge: headingLarge.copyWith(color: textPrimaryDark),
        headlineMedium: headingMedium.copyWith(color: textPrimaryDark),
        headlineSmall: headingSmall.copyWith(color: textPrimaryDark),
        bodyLarge: bodyLarge.copyWith(color: textPrimaryDark),
        bodyMedium: bodyMedium.copyWith(color: textSecondaryDark),
        bodySmall: bodySmall.copyWith(color: textMutedDark),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surfaceDark,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: headingSmall.copyWith(color: textPrimaryDark),
        iconTheme: const IconThemeData(color: textPrimaryDark),
      ),
      cardTheme: CardThemeData(
        color: cardDark,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: borderDark),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: surfaceLight,
        contentTextStyle: bodyMedium.copyWith(color: textPrimaryLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
