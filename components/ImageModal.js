import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { FONT_STYLES } from '../utils/fonts';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageModal = ({ visible, imageUri, onClose, username = '', postType = '' }) => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  // Debug log
  console.log('🖼️ ImageModal render:', { visible, imageUri, username, postType });

  const handleClose = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
    onClose();
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  };

  const handleDoubleTap = () => {
    handleReset();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.container}>
        {/* Header Controls */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {username && (
              <Text style={styles.username}>{username}</Text>
            )}
            {postType && (
              <View style={styles.postTypeBadge}>
                <Text style={styles.postTypeText}>
                  {postType === 'soru' ? 'Soru' : postType === 'danışma' ? 'Danışma' : postType}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomOut}>
              <Ionicons name="remove" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Container */}
        <View style={styles.imageContainer}>
          <TouchableOpacity
            onPress={handleDoubleTap}
            activeOpacity={1}
            style={styles.imageTouchable}
          >
                         <Image
               source={{ uri: imageUri }}
               style={[
                 styles.image,
                 {
                   transform: [
                     { scale },
                     { translateX },
                     { translateY }
                   ]
                 }
               ]}
               resizeMode="contain"
             />
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.zoomInfo}>
            Zoom: {Math.round(scale * 100)}%
          </Text>
          <Text style={styles.tipText}>
            Double tap to reset • Use buttons to zoom
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  username: {
    ...FONT_STYLES.body,
    color: '#fff',
    fontWeight: '600',
  },
  postTypeBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: screenWidth - 40,
    height: screenHeight * 0.6,
  },
  bottomInfo: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  zoomInfo: {
    ...FONT_STYLES.caption,
    color: '#fff',
    marginBottom: 8,
  },
  tipText: {
    ...FONT_STYLES.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});

export default ImageModal;
