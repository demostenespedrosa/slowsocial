import 'package:flutter/material.dart';
import '../../../core/models/momento.dart';
import '../../../core/theme/app_theme.dart';
import 'story_viewer_screen.dart';

class MomentosBar extends StatelessWidget {
  final List<AuthorMomentosGroup> groups;
  final VoidCallback onAddMomento;

  const MomentosBar({
    super.key,
    required this.groups,
    required this.onAddMomento,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        child: Row(
          children: [
            // 1. Botão Adicionar Seu Próprio Momento ("Você")
            GestureDetector(
              onTap: onAddMomento,
              child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isDark
                                  ? Colors.white.withOpacity(0.2)
                                  : Colors.black.withOpacity(0.15),
                              width: 2,
                            ),
                          ),
                          child: Center(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(28),
                              child: Container(
                                width: 56,
                                height: 56,
                                color: isDark
                                    ? AppColors.darkElevated
                                    : AppColors.lightElevated,
                                child: const Icon(Icons.person, size: 28),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: const LinearGradient(
                                colors: [Color(0xFF6C55B1), Color(0xFF7C65C1)],
                              ),
                              border: Border.all(
                                color: isDark
                                    ? AppColors.darkSurface
                                    : AppColors.lightSurface,
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.add,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Você',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // 2. Lista de Contatos com Momentos Agrupados (64x64dp / 56x56dp / 8dp gap)
            ...groups.asMap().entries.map((entry) {
              final index = entry.key;
              final group = entry.value;

              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      PageRouteBuilder(
                        opaque: false,
                        pageBuilder: (_, __, ___) => StoryViewerScreen(
                          groups: groups,
                          initialGroupIndex: index,
                        ),
                      ),
                    );
                  },
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: group.hasUnviewed
                              ? const LinearGradient(
                                  begin: Alignment.bottomLeft,
                                  end: Alignment.topRight,
                                  colors: [
                                    Color(0xFF6C55B1),
                                    Color(0xFFA855F7),
                                    Color(0xFFEC4899),
                                  ],
                                )
                              : null,
                          color: !group.hasUnviewed
                              ? (isDark
                                  ? Colors.white.withOpacity(0.18)
                                  : Colors.black.withOpacity(0.12))
                              : null,
                          boxShadow: group.hasUnviewed
                              ? [
                                  BoxShadow(
                                    color: const Color(0xFFA855F7).withOpacity(0.35),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ]
                              : null,
                        ),
                        child: Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isDark
                                  ? AppColors.darkSurface
                                  : AppColors.lightSurface,
                              width: 2,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(28),
                            child: Image.network(
                              group.authorAvatar,
                              width: 56,
                              height: 56,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: AppColors.lilacPrimary,
                                child: Center(
                                  child: Text(
                                    group.authorName.isNotEmpty
                                        ? group.authorName[0]
                                        : '?',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        width: 64,
                        child: Text(
                          group.authorName.split(' ')[0],
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: group.hasUnviewed
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: group.hasUnviewed
                                ? (isDark ? Colors.white : Colors.black)
                                : (isDark
                                    ? AppColors.darkTextSecondary
                                    : AppColors.lightTextSecondary),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
