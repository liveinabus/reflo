import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { House, HouseDetails } from './houses';

type Props = {
  house?: House;
  onClose: () => void;
  onSave: (details: HouseDetails) => Promise<void>;
};

export function HouseEditor({ house, onClose, onSave }: Props) {
  const [name, setName] = useState(house?.name ?? '');
  const [url, setUrl] = useState(house?.listingUrl ?? '');
  const [notes, setNotes] = useState(house?.notes ?? '');
  const [score, setScore] = useState(house?.accessScore?.toString() ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savePending = useRef(false);

  async function submit() {
    if (savePending.current) return;
    const trimmedName = name.trim();
    const listingUrl = url.trim();
    const scoreText = score.trim();
    if (!trimmedName) {
      setError('Enter a house name.');
      return;
    }
    if (listingUrl) {
      try {
        const parsed = new URL(listingUrl);
        if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
          throw new Error('Invalid listing URL');
        }
      } catch {
        setError('Enter a full listing URL beginning with https:// or http://.');
        return;
      }
    }
    if (scoreText && !/^(?:[0-9]|10)$/.test(scoreText)) {
      setError('Use a whole number from 0 to 10, or leave the score blank.');
      return;
    }

    savePending.current = true;
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: trimmedName,
        listingUrl: listingUrl || null,
        notes,
        accessScore: scoreText === '' ? null : Number(scoreText),
      });
    } catch {
      setError('Could not save this house. Try again.');
    } finally {
      savePending.current = false;
      setSaving(false);
    }
  }

  function close() {
    if (!savePending.current) onClose();
  }

  return (
    <Modal animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView style={styles.screen}>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            <Text accessibilityRole="header" style={styles.title}>{house ? 'Edit house' : 'New house'}</Text>
            <Text style={styles.label}>House name</Text>
            <TextInput accessibilityLabel="House name" style={styles.input} value={name} onChangeText={setName} editable={!saving} />
            <Text style={styles.label}>Listing URL (optional)</Text>
            <TextInput accessibilityLabel="Listing URL" style={styles.input} value={url} onChangeText={setUrl}
              keyboardType="url" autoCapitalize="none" autoCorrect={false} editable={!saving} />
            <Text style={styles.label}>Notes</Text>
            <TextInput accessibilityLabel="Notes" style={[styles.input, styles.notes]} value={notes}
              onChangeText={setNotes} multiline editable={!saving} />
            <Text style={styles.label}>Access-road score</Text>
            <Text style={styles.help}>0 means no access road. Leave blank if unknown.</Text>
            <TextInput accessibilityLabel="Access-road score" style={styles.input} value={score}
              onChangeText={setScore} keyboardType="number-pad" editable={!saving} />
            {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={saving} onPress={close} style={styles.cancel}>
                <Text style={styles.label}>Cancel</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={submit} style={styles.save}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save house'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f7f2' },
  form: { padding: 24, gap: 9 },
  title: { color: '#17392d', fontSize: 30, fontWeight: '700', marginBottom: 9 },
  label: { color: '#17392d', fontSize: 15, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderColor: '#c3cec6', borderWidth: 1, borderRadius: 10, padding: 12, color: '#172c24', fontSize: 16, marginBottom: 9 },
  notes: { minHeight: 100, textAlignVertical: 'top' },
  help: { color: '#475951' },
  error: { color: '#a12525' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14 },
  cancel: { padding: 14 },
  save: { backgroundColor: '#1b543e', borderRadius: 12, padding: 14 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
