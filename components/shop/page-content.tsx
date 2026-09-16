/** Basit içerik biçimi: boş satır = yeni paragraf, "## " ile başlayan satır = ara başlık. */
export function PageContent({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  return (
    <>
      {blocks.map((block, i) =>
        block.startsWith("## ") ? (
          <h2 key={i}>{block.slice(3)}</h2>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {block}
          </p>
        ),
      )}
    </>
  );
}
