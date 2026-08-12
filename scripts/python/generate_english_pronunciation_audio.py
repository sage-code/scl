import asyncio
from pathlib import Path

import edge_tts

VOICE = "en-US-AvaNeural"
OUTPUT_DIR = Path("roadmap/english/audio/alphabet")

# Key: output filename without extension. Value: spoken text for clearer model.
WORDS = {
    "cat": "cat",
    "name": "name",
    "father": "father",
    "about": "about",
    "city": "city",
    "ocean": "ocean",
    "go": "go",
    "giant": "giant",
    "gym": "gym",
    "sun": "sun",
    "rose": "rose",
    "sure": "sure",
    "vision": "vision",
    "top": "top",
    "station": "station",
    "nature": "nature",
    "listen": "listen",
    "box": "box",
    "exam": "exam",
    "luxury": "luxury",
    "yes": "yes",
    "myth": "myth",
    "fly": "fly",
    "knife": "knife",
    "know": "know",
    "write": "write",
    "gnome": "gnome",
    "lamb": "lamb",
    "walk": "walk",
    "half": "half",
    "castle": "castle",
    "night": "night",
    "debt": "debt",
    "island": "island",
    "think": "think",
    "this": "this",
    "ship": "ship",
    "chair": "chair",
    "chorus": "chorus",
    "machine": "machine",
    "phone": "phone",
    "sing": "sing",
    "nation": "nation",
    "eight": "eight",
    "through": "through",
    "though": "though",
    "thought": "thought",
}


async def synthesize_word(filename: str, text: str) -> None:
    target = OUTPUT_DIR / f"{filename}.mp3"
    communicate = edge_tts.Communicate(text=text, voice=VOICE)
    await communicate.save(str(target))


async def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    tasks = [synthesize_word(name, text) for name, text in WORDS.items()]
    await asyncio.gather(*tasks)

    print(f"Generated {len(WORDS)} audio files in {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(main())
