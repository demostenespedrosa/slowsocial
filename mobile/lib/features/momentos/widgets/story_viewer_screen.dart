import 'package:flutter/material.dart';
import '../../../core/models/momento.dart';
import '../../../core/theme/app_theme.dart';

class StoryViewerScreen extends StatefulWidget {
  final List<AuthorMomentosGroup> groups;
  final int initialGroupIndex;

  const StoryViewerScreen({
    super.key,
    required this.groups,
    this.initialGroupIndex = 0,
  });

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen>
    with SingleTickerProviderStateMixin {
  late int _currentGroupIndex;
  late int _currentStoryIndex;
  late AnimationController _animController;

  bool _isHolding = false;
  final TextEditingController _replyController = TextEditingController();
  final FocusNode _replyFocus = FocusNode();
  String? _feedbackToast;

  final List<Map<String, String>> _reactions = [
    {'emoji': '❤️', 'label': 'Curtir'},
    {'emoji': '🔥', 'label': 'Fogo'},
    {'emoji': '👏', 'label': 'Palmas'},
    {'emoji': '💡', 'label': 'Genial'},
    {'emoji': '🤝', 'label': 'Apoio'},
    {'emoji': '🤔', 'label': 'Reflexivo'},
  ];

  AuthorMomentosGroup get _currentGroup => widget.groups[_currentGroupIndex];
  MomentoStory get _currentStory => _currentGroup.stories[_currentStoryIndex];

  @override
  void initState() {
    super.initState();
    _currentGroupIndex = widget.initialGroupIndex;
    _currentStoryIndex = 0;

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    );

    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _handleNext();
      }
    });

    _replyFocus.addListener(() {
      if (_replyFocus.hasFocus) {
        _animController.stop();
      } else {
        if (!_isHolding) _animController.forward();
      }
    });

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    _replyController.dispose();
    _replyFocus.dispose();
    super.dispose();
  }

  void _handleNext() {
    if (_currentStoryIndex + 1 < _currentGroup.stories.length) {
      // Próximo story da MESMA pessoa
      setState(() {
        _currentStoryIndex++;
      });
      _animController.reset();
      _animController.forward();
    } else {
      // Passa para a PRÓXIMA pessoa
      if (_currentGroupIndex + 1 < widget.groups.length) {
        setState(() {
          _currentGroupIndex++;
          _currentStoryIndex = 0;
        });
        _animController.reset();
        _animController.forward();
      } else {
        // Acabou a fila de stories
        Navigator.of(context).pop();
      }
    }
  }

  void _handlePrev() {
    if (_animController.value > 0.25) {
      _animController.reset();
      _animController.forward();
      return;
    }

    if (_currentStoryIndex > 0) {
      // Story anterior da MESMA pessoa
      setState(() {
        _currentStoryIndex--;
      });
      _animController.reset();
      _animController.forward();
    } else {
      // Volta para a pessoa ANTERIOR (último story dela)
      if (_currentGroupIndex > 0) {
        setState(() {
          _currentGroupIndex--;
          _currentStoryIndex = widget.groups[_currentGroupIndex].stories.length - 1;
        });
        _animController.reset();
        _animController.forward();
      } else {
        _animController.reset();
        _animController.forward();
      }
    }
  }

  void _onTapDown(TapDownDetails details) {
    final screenWidth = MediaQuery.of(context).size.width;
    final dx = details.globalPosition.dx;

    if (dx < screenWidth * 0.35) {
      _handlePrev();
    } else {
      _handleNext();
    }
  }

  void _onLongPressStart(LongPressStartDetails details) {
    setState(() => _isHolding = true);
    _animController.stop();
  }

  void _onLongPressEnd(LongPressEndDetails details) {
    setState(() => _isHolding = false);
    if (!_replyFocus.hasFocus) {
      _animController.forward();
    }
  }

  void _onReact(String emoji) {
    final name = _currentGroup.authorName.split(' ')[0];
    setState(() {
      _feedbackToast = 'Você reagiu a $name com $emoji';
    });
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) setState(() => _feedbackToast = null);
    });
  }

  void _sendReply() {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;

    final name = _currentGroup.authorName.split(' ')[0];
    setState(() {
      _feedbackToast = 'Resposta enviada para $name! ✉️';
    });
    _replyController.clear();
    _replyFocus.unfocus();

    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) setState(() => _feedbackToast = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final authorFirstName = _currentGroup.authorName.split(' ')[0];

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: _onTapDown,
        onLongPressStart: _onLongPressStart,
        onLongPressEnd: _onLongPressEnd,
        behavior: HitTestBehavior.opaque,
        child: Stack(
          children: [
            // 1. Conteúdo Visual em Tela Cheia (Foto ou Cartão de Texto)
            Positioned.fill(
              child: _currentStory.mediaUrl != null
                  ? Image.network(
                      _currentStory.mediaUrl!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Text(
                          'Erro ao carregar imagem',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.all(32),
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xFF2D1B4E),
                            Color(0xFF1A162B),
                            Color(0xFF0D0B14),
                          ],
                        ),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.auto_awesome,
                              color: Color(0xFFD2C7F5),
                              size: 28,
                            ),
                            const SizedBox(height: 20),
                            Text(
                              _currentStory.textNote ?? '',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 22,
                                fontStyle: FontStyle.italic,
                                height: 1.5,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              _currentGroup.authorName,
                              style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
            ),

            // Vinheta escura no topo e na base
            Positioned.fill(
              child: IgnorePointer(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black87,
                        Colors.transparent,
                        Colors.transparent,
                        Colors.black87,
                      ],
                      stops: [0.0, 0.18, 0.75, 1.0],
                    ),
                  ),
                ),
              ),
            ),

            // Legenda flutuante acrílica (se houver foto e texto simultâneos)
            if (_currentStory.mediaUrl != null &&
                _currentStory.textNote != null &&
                _currentStory.textNote!.isNotEmpty)
              Positioned(
                bottom: 120,
                left: 16,
                right: 16,
                child: AnimatedOpacity(
                  opacity: _isHolding ? 0.2 : 1.0,
                  duration: const Duration(milliseconds: 200),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.65),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.18),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      _currentStory.textNote!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14.5,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                      ),
                    ),
                  ),
                ),
              ),

            // 2. Top Bar: Barras de Progresso Segmentadas & Cabeçalho do Autor
            SafeArea(
              child: AnimatedOpacity(
                opacity: _isHolding ? 0.2 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Barras Segmentadas
                      Row(
                        children: List.generate(
                          _currentGroup.stories.length,
                          (idx) {
                            return Expanded(
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 2),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(3),
                                  child: Container(
                                    height: 3,
                                    color: Colors.white30,
                                    child: AnimatedBuilder(
                                      animation: _animController,
                                      builder: (_, __) {
                                        double progress = 0.0;
                                        if (idx < _currentStoryIndex) {
                                          progress = 1.0;
                                        } else if (idx == _currentStoryIndex) {
                                          progress = _animController.value;
                                        }
                                        return FractionallySizedBox(
                                          alignment: Alignment.centerLeft,
                                          widthFactor: progress,
                                          child: Container(color: Colors.white),
                                        );
                                      },
                                    ),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Cabeçalho do Autor & Botão Fechar
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 19,
                            backgroundImage: NetworkImage(_currentGroup.authorAvatar),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _currentGroup.authorName,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                  ),
                                ),
                                Row(
                                  children: [
                                    Text(
                                      'Expira em ${_currentStory.expiresInHours}h',
                                      style: const TextStyle(
                                        color: Color(0xFFD2C7F5),
                                        fontSize: 11,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    if (_currentGroup.stories.length > 1) ...[
                                      const Text(
                                        ' · ',
                                        style: TextStyle(color: Colors.white60),
                                      ),
                                      Text(
                                        '${_currentStoryIndex + 1} de ${_currentGroup.stories.length}',
                                        style: const TextStyle(
                                          color: Colors.white60,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.of(context).pop(),
                            icon: const Icon(Icons.close, color: Colors.white),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Toast de Feedback Flutuante
            if (_feedbackToast != null)
              Positioned(
                top: 90,
                left: 24,
                right: 24,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.85),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Text(
                      _feedbackToast!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ),

            // 3. Barra Inferior: Reações e Input de Resposta (Instagram Style)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: AnimatedOpacity(
                  opacity: _isHolding ? 0.2 : 1.0,
                  duration: const Duration(milliseconds: 200),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Pílulas de Reações Oficiais
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: _reactions.map((r) {
                            return GestureDetector(
                              onTap: () => _onReact(r['emoji']!),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.12),
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.15),
                                  ),
                                ),
                                child: Text(
                                  r['emoji']!,
                                  style: const TextStyle(fontSize: 22),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                        const SizedBox(height: 10),

                        // Campo de Mensagem Direta
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                height: 46,
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.14),
                                  borderRadius: BorderRadius.circular(24),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.2),
                                  ),
                                ),
                                child: Center(
                                  child: TextField(
                                    controller: _replyController,
                                    focusNode: _replyFocus,
                                    style: const TextStyle(color: Colors.white, fontSize: 14),
                                    decoration: InputDecoration(
                                      hintText: 'Responder a $authorFirstName...',
                                      hintStyle: const TextStyle(color: Colors.white60),
                                      border: InputBorder.none,
                                      isDense: true,
                                    ),
                                    onSubmitted: (_) => _sendReply(),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            GestureDetector(
                              onTap: _sendReply,
                              child: Container(
                                width: 44,
                                height: 44,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  gradient: LinearGradient(
                                    colors: [
                                      Color(0xFF7C65C1),
                                      Color(0xFFA390E4),
                                    ],
                                  ),
                                ),
                                child: const Icon(
                                  Icons.send_rounded,
                                  color: Colors.white,
                                  size: 18,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
