// Responsive YouTube embed (privacy-enhanced nocookie domain) with a fallback
// link. Embedding public YouTube videos is permitted via the standard player.
export default function VideoEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="video-card">
      <div className="video-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className="video-cap">
        <span>{title}</span>
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noreferrer" className="linklike">Watch on YouTube ↗</a>
      </div>
    </div>
  );
}
