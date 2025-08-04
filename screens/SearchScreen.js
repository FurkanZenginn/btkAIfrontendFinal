import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CategoryButton = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    style={[styles.categoryButton, isActive && styles.activeCategoryButton]}
    onPress={onPress}
  >
    <Text style={[styles.categoryText, isActive && styles.activeCategoryText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('Nature');

  const categories = ['Nature', 'Food', 'Art', 'Travel'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ara... (nature, food, art, travel)"
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* Search Icon and Title */}
        <View style={styles.centerContent}>
          <View style={styles.searchIconLarge}>
            <Ionicons name="search" size={60} color="#9ca3af" />
          </View>
          
          <Text style={styles.discoverTitle}>Keşfet</Text>
          <Text style={styles.discoverSubtitle}>İlginizi çeken içerikleri aramaya başlayın</Text>

          {/* Category Buttons */}
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <CategoryButton
                key={category}
                title={category}
                isActive={activeCategory === category}
                onPress={() => setActiveCategory(category)}
              />
            ))}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === 'android' ? 35 : 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  searchIconLarge: {
    width: 120,
    height: 120,
    backgroundColor: '#f9fafb',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  discoverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  discoverSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  categoryButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
    marginVertical: 5,
  },
  activeCategoryButton: {
    backgroundColor: '#8b5cf6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeCategoryText: {
    color: '#fff',
  },
});