import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/momento.dart';
import '../models/post.dart';
import '../network/api_client.dart';
import '../services/api_service.dart';

// Provedores Base
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final apiServiceProvider = Provider<ApiService>((ref) {
  final client = ref.watch(apiClientProvider);
  return ApiService(client);
});

// Provedor de Momentos
class MomentosNotifier extends StateNotifier<AsyncValue<List<AuthorMomentosGroup>>> {
  final ApiService _api;

  MomentosNotifier(this._api) : super(const AsyncValue.loading()) {
    fetchMomentos();
  }

  Future<void> fetchMomentos() async {
    state = const AsyncValue.loading();
    try {
      final groups = await _api.getMomentos();
      state = AsyncValue.data(groups);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void markViewed(String momentoId) {
    _api.markMomentoViewed(momentoId);
    state.whenData((groups) {
      final updated = groups.map((g) {
        final stories = g.stories.map((s) {
          if (s.id == momentoId) {
            return MomentoStory(
              id: s.id,
              mediaUrl: s.mediaUrl,
              textNote: s.textNote,
              expiresInHours: s.expiresInHours,
              hasViewed: true,
              createdAt: s.createdAt,
            );
          }
          return s;
        }).toList();

        final hasUnviewed = stories.any((s) => !s.hasViewed);
        return AuthorMomentosGroup(
          authorId: g.authorId,
          authorName: g.authorName,
          authorUsername: g.authorUsername,
          authorAvatar: g.authorAvatar,
          hasUnviewed: hasUnviewed,
          stories: stories,
        );
      }).toList();

      state = AsyncValue.data(updated);
    });
  }
}

final momentosProvider =
    StateNotifierProvider<MomentosNotifier, AsyncValue<List<AuthorMomentosGroup>>>((ref) {
  final api = ref.watch(apiServiceProvider);
  return MomentosNotifier(api);
});

// Provedor de Feed
class FeedNotifier extends StateNotifier<AsyncValue<List<Post>>> {
  final ApiService _api;

  FeedNotifier(this._api) : super(const AsyncValue.loading()) {
    fetchFeed();
  }

  Future<void> fetchFeed() async {
    state = const AsyncValue.loading();
    try {
      final posts = await _api.getFeed();
      state = AsyncValue.data(posts);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> react(String postId, String reactionType) async {
    await _api.reactToPost(postId, reactionType);
    state.whenData((posts) {
      final updated = posts.map((p) {
        if (p.id == postId) {
          final isSame = p.userReaction == reactionType;
          return Post(
            id: p.id,
            authorId: p.authorId,
            authorName: p.authorName,
            authorUsername: p.authorUsername,
            authorAvatar: p.authorAvatar,
            authorHeadline: p.authorHeadline,
            content: p.content,
            formatType: p.formatType,
            mediaUrls: p.mediaUrls,
            aspectRatio: p.aspectRatio,
            reactionsCount: p.reactionsCount + (isSame ? 0 : (p.userReaction == null ? 1 : 0)),
            responsesCount: p.responsesCount,
            savedCount: p.savedCount,
            userReaction: reactionType,
            createdAt: p.createdAt,
          );
        }
        return p;
      }).toList();
      state = AsyncValue.data(updated);
    });
  }
}

final feedProvider =
    StateNotifierProvider<FeedNotifier, AsyncValue<List<Post>>>((ref) {
  final api = ref.watch(apiServiceProvider);
  return FeedNotifier(api);
});
