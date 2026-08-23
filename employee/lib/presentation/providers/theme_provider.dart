import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final themeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light);

  void toggleTheme(BuildContext context) {
    if (state == ThemeMode.system) {
      final isDark = MediaQuery.of(context).platformBrightness == Brightness.dark;
      state = isDark ? ThemeMode.light : ThemeMode.dark;
    } else {
      state = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    }
  }

  void setTheme(ThemeMode mode) {
    state = mode;
  }
}
