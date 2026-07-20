"""Download the official ConvoKit CGA-WIKI corpus into ignored local storage."""

from pathlib import Path

from convokit import Corpus, download


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "external" / "convokit"


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    corpus_path = download(
        "conversations-gone-awry-corpus",
        data_dir=str(DATA_DIR),
    )
    corpus = Corpus(filename=corpus_path)
    corpus.print_summary_stats()
    print(f"Corpus ready at {corpus_path}")


if __name__ == "__main__":
    main()
