import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class CommunityItem {
  final String id;
  final String name;
  final String category;
  final String icon;
  final String description;
  final int membersCount;
  final int unreadCount;
  final bool isPinned;

  const CommunityItem({
    required this.id,
    required this.name,
    required this.category,
    required this.icon,
    required this.description,
    required this.membersCount,
    this.unreadCount = 0,
    this.isPinned = false,
  });
}

class CommunitiesScreen extends StatelessWidget {
  const CommunitiesScreen({super.key});

  final List<CommunityItem> _communities = const [
    CommunityItem(
      id: 'c-1',
      name: 'Sistemas & Baixo Nível',
      category: 'Engenharia',
      icon: '⚡',
      description: 'Discussões aprofundadas sobre Rust, C++, arquitetura de computadores e sistemas distribuídos.',
      membersCount: 420,
      unreadCount: 3,
      isPinned: true,
    ),
    CommunityItem(
      id: 'c-2',
      name: 'Design Calmo & Ergonomia Cognitiva',
      category: 'Design & IHC',
      icon: '🌿',
      description: 'Interfaces focadas em atenção humana, redução de fricção cognitiva e estética minimalista.',
      membersCount: 680,
      unreadCount: 1,
      isPinned: true,
    ),
    CommunityItem(
      id: 'c-3',
      name: 'Hardware Livre & Sensores',
      category: 'Engenharia',
      icon: '🔌',
      description: 'Circuitos de ultra-baixo consumo, telemetria solar e microcontroladores RISC-V.',
      membersCount: 290,
      unreadCount: 0,
    ),
    CommunityItem(
      id: 'c-4',
      name: 'Acessibilidade Digital Universal',
      category: 'Inclusão',
      icon: '♿',
      description: 'Diretrizes WCAG, compatibilidade com leitores de tela e navegação fluida por teclado.',
      membersCount: 340,
      unreadCount: 2,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Comunidades Calmas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search_rounded),
            onPressed: () {},
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        physics: const BouncingScrollPhysics(),
        children: [
          Text(
            'ESPAÇOS DE DISCUSSÃO PROFUNDA',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.1,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 12),
          ..._communities.map((c) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkElevated : AppColors.lightElevated,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Center(
                      child: Text(
                        c.icon,
                        style: const TextStyle(fontSize: 24),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                c.name,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (c.isPinned) ...[
                              const SizedBox(width: 6),
                              const Icon(
                                Icons.push_pin_rounded,
                                size: 14,
                                color: AppColors.lilacPrimary,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          c.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${c.membersCount} membros',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.lilacPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (c.unreadCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.lilacPrimary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${c.unreadCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
