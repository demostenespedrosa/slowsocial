import 'package:dio/dio.dart';
import '../models/momento.dart';
import '../models/post.dart';
import '../network/api_client.dart';

class ApiService {
  final ApiClient _apiClient;

  ApiService(this._apiClient);

  Dio get _dio => _apiClient.client;

  // 1. FEED & POSTS
  Future<List<Post>> getFeed({int limit = 15, int offset = 0}) async {
    try {
      final res = await _dio.get(
        '/feed',
        queryParameters: {'limit': limit, 'offset': offset},
      );
      if (res.data['success'] == true && res.data['data'] != null) {
        return (res.data['data'] as List)
            .map((item) => Post.fromJson(item))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<bool> createPost({
    required String content,
    String formatType = 'thought',
    List<String> mediaUrls = const [],
    String aspectRatio = '16:9',
  }) async {
    try {
      final res = await _dio.post('/posts', data: {
        'content': content,
        'format_type': formatType,
        'media_urls': mediaUrls,
        'aspect_ratio': aspectRatio,
      });
      return res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  Future<bool> reactToPost(String postId, String reactionType) async {
    try {
      final res = await _dio.post(
        '/posts/$postId/react',
        data: {'reaction_type': reactionType},
      );
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // 2. COMENTÁRIOS DE POSTS
  Future<List<dynamic>> getComments(String postId) async {
    try {
      final res = await _dio.get('/posts/$postId/comments');
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as List;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<dynamic> createComment(String postId, String content, {String? parentId}) async {
    try {
      final res = await _dio.post('/posts/$postId/comments', data: {
        'content': content,
        'parent_id': parentId,
      });
      if (res.data['success'] == true) {
        return res.data['data'];
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // 3. MOMENTOS (STORIES 24H)
  Future<List<AuthorMomentosGroup>> getMomentos() async {
    try {
      final res = await _dio.get('/momentos');
      if (res.data['success'] == true && res.data['data'] != null) {
        return (res.data['data'] as List)
            .map((item) => AuthorMomentosGroup.fromJson(item))
            .toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<void> markMomentoViewed(String momentoId) async {
    try {
      await _dio.post('/momentos/$momentoId/view');
    } catch (_) {}
  }

  // 4. CONVERSAS & CHAT
  Future<List<dynamic>> getConversations({String tab = 'direct'}) async {
    try {
      final res = await _dio.get(
        '/conversations',
        queryParameters: {'tab': tab},
      );
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as List;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<bool> sendMessage(String conversationId, String content) async {
    try {
      final res = await _dio.post(
        '/conversations/$conversationId/messages',
        data: {'content': content},
      );
      return res.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  // 5. CONEXÕES (NETWORKING CONSCIENTE)
  Future<List<dynamic>> getConnections({String status = 'active'}) async {
    try {
      final res = await _dio.get('/connections', queryParameters: {'status': status});
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as List;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<dynamic> requestConnection(String targetUserId, String note) async {
    try {
      final res = await _dio.post('/connections/request', data: {
        'target_user_id': targetUserId,
        'note': note,
      });
      return res.data['data'];
    } catch (_) {
      return null;
    }
  }

  Future<bool> acceptConnection(String connectionId) async {
    try {
      final res = await _dio.post('/connections/$connectionId/accept');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  Future<bool> rejectConnection(String connectionId) async {
    try {
      final res = await _dio.post('/connections/$connectionId/reject');
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // 6. NOTIFICAÇÕES
  Future<List<dynamic>> getNotifications({int limit = 20, int offset = 0}) async {
    try {
      final res = await _dio.get('/notifications', queryParameters: {
        'limit': limit,
        'offset': offset,
      });
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as List;
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  Future<int> getUnreadNotificationCount() async {
    try {
      final res = await _dio.get('/notifications/unread-count');
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data']['unread_count'] ?? 0;
      }
      return 0;
    } catch (_) {
      return 0;
    }
  }

  Future<void> markNotificationAsRead(String notifId) async {
    try {
      await _dio.patch('/notifications/$notifId/read');
    } catch (_) {}
  }

  Future<void> markAllNotificationsAsRead() async {
    try {
      await _dio.post('/notifications/read-all');
    } catch (_) {}
  }

  // 7. PERFIL DE USUÁRIO
  Future<Map<String, dynamic>?> getMyProfile() async {
    try {
      final res = await _dio.get('/users/me');
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    try {
      final res = await _dio.get('/users/$userId/profile');
      if (res.data['success'] == true && res.data['data'] != null) {
        return res.data['data'] as Map<String, dynamic>;
      }
      return null;
    } catch (_) {
      return null;
    }
  }
}
