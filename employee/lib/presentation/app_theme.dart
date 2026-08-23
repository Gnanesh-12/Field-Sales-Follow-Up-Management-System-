import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
  }) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: GoogleFonts.inter(
        color: textSecondary,
        fontSize: 14,
      ),
      hintStyle: GoogleFonts.inter(
        color: textMuted,
        fontSize: 14,
      ),
      prefixIcon: icon != null ? Icon(icon, color: accentTeal, size: 22) : null,
      filled: true,
      fillColor: surfaceDark.withValues(alpha: 0.6),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: borderSubtle),
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
}
