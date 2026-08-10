import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Search, X, Check } from 'lucide-react-native';

export default function SearchableSelect({ visible, title = "Select Option", items = [], selectedValue, onSelect, onClose, labelKey = "name", valueKey = "id", subtitleKey }) {
  const [search, setSearch] = useState('');

  const filteredItems = items.filter((item) => {
    const label = String(item[labelKey] || '').toLowerCase();
    const subtitle = subtitleKey ? String(item[subtitleKey] || '').toLowerCase() : '';
    const query = search.toLowerCase();
    return label.includes(query) || subtitle.includes(query);
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#64748b"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={(item, idx) => String(item[valueKey] || idx)}
            renderItem={({ item }) => {
              const label = item[labelKey];
              const subtitle = subtitleKey ? item[subtitleKey] : null;
              const isSelected = item[valueKey] === selectedValue;

              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>{label}</Text>
                    {subtitle ? <Text style={styles.itemSubtitle}>{subtitle}</Text> : null}
                  </View>
                  {isSelected && <Check size={18} color="#009a44" />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No matching records found.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    borderRadius: 8,
  },
  itemRowSelected: {
    backgroundColor: 'rgba(0, 154, 68, 0.12)',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  itemTextSelected: {
    color: '#4ade80',
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
