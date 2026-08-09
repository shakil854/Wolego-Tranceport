import React, { useState } from "react";
import { Modal, View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import CustomInput from "./CustomInput";
import CustomButton from "./CustomButton";
import { Search, X, Check } from "lucide-react-native";

export default function SearchablePickerModal({
  visible,
  onClose,
  onSelect,
  items = [],
  title = "Select Option",
  keyExtractor = (item) => item.id || item.partyName || item.truckNo,
  labelExtractor = (item) => item.partyName || item.truckNo || String(item),
  subLabelExtractor = (item) => item.mobileNos || item.ownerName || item.city || "",
  selectedValue,
}) {
  const [query, setQuery] = useState("");

  const filteredItems = items.filter((item) => {
    const label = labelExtractor(item).toLowerCase();
    const subLabel = subLabelExtractor(item).toLowerCase();
    const q = query.toLowerCase();
    return label.includes(q) || subLabel.includes(q);
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <CustomInput
            value={query}
            onChangeText={setQuery}
            placeholder="Type to search..."
            icon={Search}
            style={{ marginBottom: 10 }}
          />

          <FlatList
            data={filteredItems}
            keyExtractor={keyExtractor}
            style={styles.list}
            renderItem={({ item }) => {
              const label = labelExtractor(item);
              const subLabel = subLabelExtractor(item);
              const isSelected = selectedValue === label || selectedValue === item;

              return (
                <Pressable
                  style={[styles.itemRow, isSelected && styles.selectedRow]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemLabel, isSelected && styles.selectedText]}>{label}</Text>
                    {subLabel ? <Text style={styles.itemSubLabel}>{subLabel}</Text> : null}
                  </View>
                  {isSelected && <Check size={18} color="#f59e0b" />}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No matching items found</Text>
            }
          />

          <CustomButton title="Close" variant="secondary" onPress={onClose} style={{ marginTop: 10 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#1e293b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
    borderWidth: 1,
    borderColor: "#334155",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#f8fafc",
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    marginVertical: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  selectedRow: {
    backgroundColor: "#0f172a",
    borderColor: "#f59e0b",
    borderWidth: 1,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
  selectedText: {
    color: "#f59e0b",
  },
  itemSubLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  emptyText: {
    color: "#64748b",
    textAlign: "center",
    padding: 20,
    fontSize: 13,
  },
});
