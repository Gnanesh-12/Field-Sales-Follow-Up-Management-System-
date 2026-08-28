import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

extension ThemeExtension on BuildContext {
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
  Color get surfaceColor => isDarkMode ? AppTheme.surfaceDark : AppTheme.surfaceLight;
  Color get backgroundColor => isDarkMode ? AppTheme.backgroundDark : AppTheme.backgroundLight;
  Color get cardColor => isDarkMode ? AppTheme.cardDark : AppTheme.cardLight;
  Color get textPrimaryColor => isDarkMode ? AppTheme.textPrimary : AppTheme.textPrimaryLight;
  Color get textSecondaryColor => isDarkMode ? AppTheme.textSecondary : AppTheme.textSecondaryLight;
  Color get textMutedColor => isDarkMode ? AppTheme.textMuted : AppTheme.textMutedLight;
  Color get borderSubtleColor => isDarkMode ? AppTheme.borderSubtle : AppTheme.borderSubtleLight;
}

/// Centralized design system for the Field Sales app.
/// Premium dark theme with vibrant coral/teal accents.
class AppTheme {
  AppTheme._();

  // ─── Core Colors ──────────────────────────────────────────────
  static const Color backgroundDark = Color(0xFF0A0E21);
  static const Color surfaceDark = Color(0xFF1A1A2E);
  static const Color cardDark = Color(0xFF16213E);
  static const Color borderSubtle = Color(0x33FFFFFF);

  static const Color accentCoral = Color(0xFFE94560);
  static const Color accentPink = Color(0xFFFF6B6B);
  static const Color accentTeal = Color(0xFF00D2FF);
  static const Color accentGold = Color(0xFFFFC107);
  static const Color accentGreen = Color(0xFF00E676);

  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xB3FFFFFF); // 70% white
  static const Color textMuted = Color(0x80FFFFFF); // 50% white

  // ─── Light Mode Colors ─────────────────────────────────────────
  static const Color backgroundLight = Color(0xFFF8F9FA); // Off-white
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color cardLight = Color(0xFFF1F3F5);
  static const Color borderSubtleLight = Color(0x1A000000); // 10% black

  static const Color textPrimaryLight = Color(0xFF212529);
  static const Color textSecondaryLight = Color(0xFF495057);
  static const Color textMutedLight = Color(0xFF868E96);

  // ─── Gradients ────────────────────────────────────────────────
  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0A0E21),
      Color(0xFF1A1A2E),
      Color(0xFF16213E),
      Color(0xFF0F3460),
    ],
    stops: [0.0, 0.3, 0.6, 1.0],
  );

  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accentCoral, accentPink],
  );

  static const LinearGradient tealGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF00D2FF), Color(0xFF3A7BD5)],
  );

  static const LinearGradient goldGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFC107), Color(0xFFFF9800)],
  );

  static const LinearGradient greenGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF00E676), Color(0xFF00C853)],
  );

  // ─── Shadows ──────────────────────────────────────────────────
  static List<BoxShadow> glowShadow(Color color) => [
        BoxShadow(
          color: color.withValues(alpha: 0.4),
          blurRadius: 20,
          spreadRadius: 2,
        ),
      ];

  static List<BoxShadow> subtleShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.3),
      blurRadius: 15,
      offset: const Offset(0, 5),
    ),
  ];

  // ─── Text Styles ──────────────────────────────────────────────
  static TextStyle get headingLarge => GoogleFonts.poppins(
        fontSize: 32,
        fontWeight: FontWeight.bold,
        color: textPrimary,
        letterSpacing: -0.5,
      );

  static TextStyle get headingMedium => GoogleFonts.poppins(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: textPrimary,
      );

  static TextStyle get headingSmall => GoogleFonts.poppins(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: textPrimary,
      );

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.normal,
        color: textPrimary,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.normal,
        color: textSecondary,
      );

  static TextStyle get bodySmall => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.normal,
        color: textMuted,
      );

  static TextStyle get labelLarge => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textPrimary,
        letterSpacing: 1.2,
      );

  static TextStyle get buttonText => GoogleFonts.poppins(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textPrimary,
        letterSpacing: 1.0,
      );

  // ─── Input Decoration ─────────────────────────────────────────
  static InputDecoration inputDecoration({
    required String label,
    IconData? icon,
    String? hint,
    BuildContext? context,
  }) {
    final isDark = context != null ? context.isDarkMode : true;
    final fillClr = isDark ? surfaceDark.withValues(alpha: 0.6) : surfaceLight;
    final labelClr = isDark ? textSecondary : textSecondaryLight;
    final hintClr = isDark ? textMuted : textMutedLight;
    final borderClr = isDark ? borderSubtle : borderSubtleLight;

    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: GoogleFonts.inter(
        color: labelClr,
        fontSize: 14,
      ),
      hintStyle: GoogleFonts.inter(
        color: hintClr,
        fontSize: 14,
      ),
      prefixIcon: icon != null ? Icon(icon, color: accentTeal, size: 22) : null,
      filled: true,
      fillColor: fillClr,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: borderClr),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: borderClr),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: accentTeal, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: accentCoral, width: 1.5),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: accentCoral, width: 2),
      ),
      errorStyle: GoogleFonts.inter(
        color: accentPink,
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  // ─── Theme Data ───────────────────────────────────────────────
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: accentCoral,
        secondary: accentTeal,
        surface: surfaceDark,
        error: accentPink,
      ),
      textTheme: TextTheme(
        headlineLarge: headingLarge,
        headlineMedium: headingMedium,
        headlineSmall: headingSmall,
        bodyLarge: bodyLarge,
        bodyMedium: bodyMedium,
        bodySmall: bodySmall,
        labelLarge: labelLarge,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: headingSmall,
        iconTheme: const IconThemeData(color: textPrimary),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: cardDark,
        contentTextStyle: bodyMedium.copyWith(color: textPrimary),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: backgroundLight,
      colorScheme: const ColorScheme.light(
        primary: accentCoral,
        secondary: accentTeal,
        surface: surfaceLight,
        error: accentPink,
      ),
      textTheme: TextTheme(
        headlineLarge: headingLarge.copyWith(color: textPrimaryLight),
        headlineMedium: headingMedium.copyWith(color: textPrimaryLight),
        headlineSmall: headingSmall.copyWith(color: textPrimaryLight),
        bodyLarge: bodyLarge.copyWith(color: textPrimaryLight),
        bodyMedium: bodyMedium.copyWith(color: textSecondaryLight),
        bodySmall: bodySmall.copyWith(color: textMutedLight),
        labelLarge: labelLarge.copyWith(color: textPrimaryLight),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: headingSmall.copyWith(color: textPrimaryLight),
        iconTheme: const IconThemeData(color: textPrimaryLight),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: cardLight,
        contentTextStyle: bodyMedium.copyWith(color: textPrimaryLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
