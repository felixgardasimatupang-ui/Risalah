import re
import json
import logging
from app.models.schemas import NormalizationRequest, NormalizationResponse

logger = logging.getLogger(__name__)


class IndonesianNLPService:
    def __init__(self):
        self.nlp = None
        self._load_spacy()

    def _load_spacy(self):
        try:
            import spacy
            self.nlp = spacy.load("id_core_news_sm")
        except Exception as e:
            logger.warning("Could not load spaCy ID model: %s", e)

    def normalize(self, request: NormalizationRequest) -> NormalizationResponse:
        text = request.text
        changes = []

        if request.fix_punctuation:
            text, punct_changes = self._fix_punctuation(text)
            changes.extend(punct_changes)

        if request.normalize_numbers:
            text, num_changes = self._normalize_numbers(text)
            changes.extend(num_changes)

        if request.normalize_currency:
            text, curr_changes = self._normalize_currency(text)
            changes.extend(curr_changes)

        if request.normalize_dates:
            text, date_changes = self._normalize_dates(text)
            changes.extend(date_changes)

        if request.capitalize:
            text = self._capitalize(text)
            changes.append({"type": "capitalize", "description": "Capitalized text"})

        return NormalizationResponse(
            original=request.text,
            normalized=text,
            changes=changes,
        )

    def correct_grammar(self, text: str) -> dict:
        corrections = []

        if self.nlp:
            doc = self.nlp(text)
            for token in doc:
                if token.is_oov:
                    corrections.append({
                        "word": token.text,
                        "position": token.idx,
                        "suggestion": None,
                    })

        return {"original": text, "corrections": corrections}

    def summarize(self, text: str) -> dict:
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', text) if s.strip()]
        word_freq = {}
        for s in sentences:
            for w in s.lower().split():
                if len(w) > 3:
                    word_freq[w] = word_freq.get(w, 0) + 1

        scored = [(sum(word_freq.get(w.lower(), 0) for w in s.split()), s) for s in sentences]
        scored.sort(reverse=True)

        summary_sentences = [s for _, s in scored[:max(3, len(sentences) // 3)]]
        return {
            "summary": " ".join(summary_sentences),
            "sentence_count": len(sentences),
            "summary_sentence_count": len(summary_sentences),
        }

    def _fix_punctuation(self, text: str) -> tuple[str, list[dict]]:
        changes = []
        text = re.sub(r'\s+([,.!?:;])', r'\1', text)
        if not text.endswith(('.', '!', '?')):
            text += '.'
            changes.append({"type": "punctuation", "description": "Added trailing period"})
        return text, changes

    def _normalize_numbers(self, text: str) -> tuple[str, list[dict]]:
        changes = []
        try:
            from num2words import num2words
            number_pattern = re.compile(r'\b(\d+)\b')
            for match in number_pattern.finditer(text):
                num = int(match.group(1))
                if num < 1000:
                    words = num2words(num, lang='id')
                    changes.append({
                        "type": "number",
                        "original": match.group(1),
                        "normalized": words,
                    })
            text = number_pattern.sub(lambda m: num2words(int(m.group(1)), lang='id')
                                        if int(m.group(1)) < 1000 else m.group(1), text)
        except ImportError:
            pass
        return text, changes

    def _normalize_currency(self, text: str) -> tuple[str, list[dict]]:
        changes = []
        currency_pattern = re.compile(r'(?:Rp\.?\s*)?([\d,]+(?:\.\d{3})*(?:,\d{1,2})?)\s*(?:ribu|juta|milyar|trilyun)?', re.IGNORECASE)
        for match in currency_pattern.finditer(text):
            changes.append({
                "type": "currency",
                "original": match.group(0),
                "normalized": f"Rp {match.group(1)}",
            })
        return text, changes

    def _normalize_dates(self, text: str) -> tuple[str, list[dict]]:
        changes = []
        date_pattern = re.compile(r'(\d{1,2})\s*(?:/|-)\s*(\d{1,2})\s*(?:/|-)\s*(\d{2,4})')
        for match in date_pattern.finditer(text):
            changes.append({
                "type": "date",
                "original": match.group(0),
                "normalized": f"{match.group(1)}/{match.group(2)}/{match.group(3)}",
            })
        return text, changes

    def _capitalize(self, text: str) -> str:
        sentences = re.split(r'(?<=[.!?])\s+', text)
        sentences = [s[0].upper() + s[1:] if s else s for s in sentences]
        return " ".join(sentences)
