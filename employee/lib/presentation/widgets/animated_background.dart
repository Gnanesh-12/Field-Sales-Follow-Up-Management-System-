import 'dart:math';
import 'package:flutter/material.dart';
import '../app_theme.dart';

/// Animated gradient background with floating luminous particles.
/// Creates a deep-space-like atmosphere for auth screens.
class AnimatedBackground extends StatefulWidget {
  final Widget child;

  const AnimatedBackground({super.key, required this.child});

  @override
  State<AnimatedBackground> createState() => _AnimatedBackgroundState();
}

class _AnimatedBackgroundState extends State<AnimatedBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 10),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Base gradient
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment(
                    -1.0 + sin(_controller.value * 2 * pi) * 0.3,
                    -1.0 + cos(_controller.value * 2 * pi) * 0.3,
                  ),
                  end: Alignment(
                    1.0 + cos(_controller.value * 2 * pi) * 0.3,
                    1.0 + sin(_controller.value * 2 * pi) * 0.3,
                  ),
                  colors: context.isDarkMode
                      ? const [
                          Color(0xFF0A0E21),
                          Color(0xFF1A1A2E),
                          Color(0xFF16213E),
                          Color(0xFF0F3460),
                        ]
                      : const [
                          Color(0xFFF8F9FA),
                          Color(0xFFE9ECEF),
                          Color(0xFFDEE2E6),
                          Color(0xFFCED4DA),
                        ],
                  stops: const [0.0, 0.3, 0.6, 1.0],
                ),
              ),
            );
          },
        ),
        // Floating particles
        ...List.generate(15, (index) => _FloatingParticle(
          controller: _controller,
          index: index,
        )),
        // Radial glow overlay
        Positioned(
          top: -100,
          right: -100,
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.accentCoral.withValues(alpha: (context.isDarkMode ? 0.08 : 0.04) + sin(_controller.value * 2 * pi) * 0.03),
                      Colors.transparent,
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        Positioned(
          bottom: -80,
          left: -80,
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      AppTheme.accentTeal.withValues(alpha: (context.isDarkMode ? 0.06 : 0.03) + cos(_controller.value * 2 * pi) * 0.03),
                      Colors.transparent,
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        // Content
        widget.child,
      ],
    );
  }
}

class _FloatingParticle extends StatelessWidget {
  final AnimationController controller;
  final int index;

  const _FloatingParticle({required this.controller, required this.index});

  @override
  Widget build(BuildContext context) {
    final random = Random(index * 42);
    final size = MediaQuery.of(context).size;
    final startX = random.nextDouble() * size.width;
    final startY = random.nextDouble() * size.height;
    final radius = 2.0 + random.nextDouble() * 3.0;
    final speed = 0.5 + random.nextDouble() * 1.5;
    final phase = random.nextDouble() * 2 * pi;
    final isTeal = random.nextBool();

    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final t = controller.value * speed;
        final x = startX + sin(t * 2 * pi + phase) * 30;
        final y = startY + cos(t * 2 * pi + phase * 0.7) * 40;
        final opacity = 0.15 + sin(t * 2 * pi + phase) * 0.1;

        return Positioned(
          left: x % size.width,
          top: y % size.height,
          child: Container(
            width: radius * 2,
            height: radius * 2,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: (isTeal ? AppTheme.accentTeal : AppTheme.accentCoral)
                  .withValues(alpha: opacity.clamp(0.05, 0.3)),
              boxShadow: [
                BoxShadow(
                  color: (isTeal ? AppTheme.accentTeal : AppTheme.accentCoral)
                      .withValues(alpha: opacity.clamp(0.05, 0.2)),
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
