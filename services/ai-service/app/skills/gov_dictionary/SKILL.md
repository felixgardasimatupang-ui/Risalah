# Government Dictionary Skill

## Description
Skill for extracting and normalizing Indonesian government terminology from text. Uses KBBI (Kamus Besar Bahasa Indonesia) + official government dictionaries (Peraturan Pemerintah, Permendagri, etc.) for accurate entity extraction.

## Usage
```python
from app.skills.gov_dictionary import GovDictionarySkill

skill = GovDictionarySkill()
entities = skill.extract_entities(text)
```

## Features
- Government term normalization (APBD, APBN, DPRD, etc.)
- Institution name resolution (Kementerian, Lembaga, OPD)
- Regulation reference extraction (UU, PP, Perpres, Permendagri, Perda)
- Position/title normalization (Gubernur, Bupati, Sekda, Kepala Dinas)
- Regional name resolution (Provinsi, Kabupaten, Kota, Kecamatan, Kelurahan)
- Fuzzy matching for ASR errors
- Confidence scoring

## Implementation

### 1. Core Extractor
```python
# app/skills/gov_dictionary/extractor.py
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from app.models.schemas import GovernmentEntity
import re
import json
from pathlib import Path
```

### 2. Skill Entry Point
```python
# app/skills/gov_dictionary/__init__.py
from .extractor import GovDictionaryExtractor

class GovDictionarySkill:
    """Government Dictionary Skill for entity extraction"""
    
    def __init__(self):
        self.extractor = GovDictionaryExtractor()
    
    def extract_entities(self, text: str) -> List[GovernmentEntity]:
        return self.extractor.extract(text)
    
    def normalize_term(self, term: str) -> Optional[str]:
        return self.extractor.normalize(term)
    
    def get_glossary(self, category: Optional[str] = None) -> Dict:
        return self.extractor.get_glossary(category)
```

### 3. Skill Manifest
```yaml
# app/skills/gov_dictionary/SKILL.md
name: gov-dictionary
description: Extract and normalize Indonesian government terminology
version: 1.0.0
author: Risalah Team
capabilities:
  - entity_extraction
  - term_normalization
  - glossary_lookup
triggers:
  - "government terms"
  - "official terminology"
  - "entity extraction"
```

### 4. Data Files
```
app/skills/gov_dictionary/data/
├── government_terms.json      # Core terminology
├── institutions.json          # Government institutions
├── regulations.json           # Regulation references
├── positions.json             # Position/titles
└── regions.json               # Indonesian regions
```

---

## Integration with Pipeline
```python
# In transcription pipeline
from app.skills.gov_dictionary import GovDictionarySkill

gov_dict = GovDictionarySkill()

# After transcription, extract entities
entities = gov_dict.extract_entities(transcript_text)

# Normalize transcript with corrections
for entity in entities:
    if entity.confidence > 0.8:
        transcript = transcript.replace(entity.text, entity.normalized_text)
```

---

## Testing
```bash
# Test entity extraction
python -m pytest tests/test_gov_dictionary.py -v

# Test with sample transcripts
python -c "
from app.skills.gov_dictionary import GovDictionarySkill
skill = GovDictionarySkill()
text = 'Rapat DPRD membahas APBD 2025 sebesar 5 triliun rupiah'
entities = skill.extract_entities(text)
for e in entities:
    print(f'{e.entity_type}: {e.text} -> {e.normalized_text} ({e.confidence})')
"
```