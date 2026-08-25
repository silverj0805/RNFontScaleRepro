import { StyleSheet } from 'react-native';
import { BASE_FONT_SIZE } from './constants';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginBottom: 10,
  },
  subtitleValue: {
    fontWeight: '700',
    color: '#000',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#e0e0e0',
    marginRight: 6,
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#2f6fed',
  },
  tabButtonText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#222',
  },
  tabButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  resultsBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 6,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    paddingBottom: 4,
    marginBottom: 4,
  },
  resultsHeaderCell: {
    fontWeight: '700',
  },
  resultsRow: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  resultsCell: {
    flex: 1,
    fontSize: 12,
  },
  resultsColTest: {
    flex: 0.8,
  },
  resultsColAllow: {
    flex: 1.6,
  },
  resultsColHeight: {
    flex: 1.2,
  },
  hint: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
  },
  testArea: {
    marginTop: 4,
  },
  testCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  testDescription: {
    fontSize: 12,
    color: '#444',
    marginTop: 12,
  },
  sampleText: {
    fontSize: BASE_FONT_SIZE,
    alignSelf: 'flex-start',
  },
  bgTest1: {
    backgroundColor: '#ffe08a',
  },
  bgTest2: {
    backgroundColor: '#a8e6a1',
  },
  bgTest3: {
    backgroundColor: '#a1c9e6',
  },
});
