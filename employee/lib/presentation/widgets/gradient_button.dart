import 'package:flutter/material.dart';
import '../app_theme.dart';

/// A premium gradient button with glow effect and loading state.
class GradientButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final LinearGradient? gradient;
  final double height;
  final double borderRadius;

  const GradientButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.gradient,
    this.height = 56,
    this.borderRadius = 16,
  });

  @override
  State<GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _shimmerController;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat();
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final gradient = widget.gradient ?? AppTheme.accentGradient;
    final isDisabled = widget.onPressed == null || widget.isLoading;

    return GestureDetector(
      onTapDown: isDisabled ? null : (_) => setState(() => _isPressed = true),
      onTapUp: isDisabled ? null : (_) {
        setState(() => _isPressed = false);
        widget.onPressed?.call();
      },
      onTapCancel: isDisabled ? null : () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 100),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: isDisabled
                ? LinearGradient(colors: [
                    Colors.grey.shade700,
                    Colors.grey.shade600,
                  ])
                : gradient,
            boxShadow: isDisabled
                ? []
                : [
                    BoxShadow(
                      color: (gradient.colors.first).withValues(alpha: _isPressed ? 0.6 : 0.4),
                      blurRadius: _isPressed ? 15 : 20,
                      offset: const Offset(0, 6),
                      spreadRadius: _isPressed ? 0 : 2,
                    ),
                  ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            child: Stack(
              children: [
                // Shimmer overlay
                if (!isDisabled)
                  AnimatedBuilder(
                    animation: _shimmerController,
                    builder: (context, _) {
                      return Positioned(
                        left: -200 + (_shimmerController.value * 600),
                        top: 0,
                        bottom: 0,
                        child: Container(
                          width: 100,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.white.withValues(alpha: 0),
                                Colors.white.withValues(alpha: 0.1),
                                Colors.white.withValues(alpha: 0),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                // Content
                Center(
                  child: widget.isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                                AppTheme.textPrimary),
                          ),
                        )
                      : Text(
                          widget.text,
                          style: AppTheme.buttonText,
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
