import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT_STYLES } from '../utils/fonts';

const PostItem = ({ 
  username, 
  userImage, 
  postImage, 
  caption,
  likes, 
  timeAgo, 
  isLiked, 
  isSaved, 
  isFromAI,
  aiPrompt,
  aiResponseType,
  commentCount,
  userId,
  isOwnPost,
  postType,
  onLike, 
  onComment, 
  onBookmark,
  onUserPress
}) => (
  <View style={styles.postContainer}>
    {/* Post Header */}
    <View style={styles.postHeader}>
      <TouchableOpacity 
        style={styles.userInfo}
        onPress={() => onUserPress && onUserPress(userId, username)}
        disabled={isFromAI}
      >
        {userImage ? (
          <Image source={{ uri: userImage }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarFallback}>
            <Text style={styles.userAvatarFallbackText}>
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        <View style={styles.userInfoText}>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>
              {isFromAI ? '🤖 AI Soru' : username}
            </Text>
            {postType && (
              <View style={styles.postTypeBadge}>
                <Text style={styles.postTypeText}>
                  {postType === 'soru' ? 'Soru' : postType === 'danışma' ? 'Danışma' : postType}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-horizontal" size={20} color="#9ca3af" />
      </TouchableOpacity>
    </View>

    {/* Post Image */}
    {postImage && (
      <View style={styles.imageContainer}>
        <Image source={{ uri: postImage }} style={styles.postImage} />
        {/* AI Post Badge - Görselin üstünde */}
        {isFromAI && (
          <View style={styles.aiBadgeOverlay}>
            <Ionicons name="sparkles" size={16} color="#fff" />
            <Text style={styles.aiBadgeTextOverlay}>AI Soru</Text>
          </View>
        )}
      </View>
    )}

    {/* AI Post Badge - Görsel yoksa */}
    {isFromAI && !postImage && (
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={16} color="#8b5cf6" />
        <Text style={styles.aiBadgeText}>AI Soru</Text>
      </View>
    )}

    {/* Post Caption - Görselin hemen altında */}
    {caption && (
      <View style={[
        styles.captionContainer,
        isFromAI && styles.aiCaptionContainer
      ]}>
        <View style={styles.captionContent}>
          <Text style={[
            styles.captionText,
            isFromAI && styles.aiCaptionText
          ]}>
            <Text style={styles.usernameInCaption}>{username}</Text>
            {isFromAI ? ': ' : ': '}
            {caption}
          </Text>
        </View>
        <Text style={styles.captionTime}>{timeAgo}</Text>
      </View>
    )}

    {/* Post Actions */}
    <View style={styles.postActions}>
      <View style={styles.leftActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onLike && onLike()}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#ef4444" : "#6b7280"} 
          />
          {likes > 0 && (
            <Text style={styles.likeCount}>{likes}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => onComment && onComment()}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.bookmarkButton} 
        onPress={() => onBookmark && onBookmark()}
      >
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={24} 
          color={isSaved ? "#8b5cf6" : "#6b7280"} 
        />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  postContainer: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarFallbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfoText: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    ...FONT_STYLES.body,
    fontWeight: '600',
    color: '#111827',
  },
  postTypeBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  timeAgo: {
    ...FONT_STYLES.caption,
    color: '#6b7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  aiBadgeOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeTextOverlay: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  aiBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  aiBadgeText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  aiCaptionContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
  },
  captionContent: {
    flex: 1,
  },
  captionText: {
    ...FONT_STYLES.body,
    color: '#374151',
    lineHeight: 20,
  },
  aiCaptionText: {
    color: '#1f2937',
    fontWeight: '500',
  },
  usernameInCaption: {
    fontWeight: '600',
    color: '#111827',
  },
  captionTime: {
    ...FONT_STYLES.caption,
    color: '#9ca3af',
    marginTop: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  bookmarkButton: {
    padding: 4,
  },
});

export default PostItem; 