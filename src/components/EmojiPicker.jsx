const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😜", "🤔", "🙄",
  "😴", "🥱", "😭", "😢", "😡", "🤯", "😱", "🥳", "😎", "🤩",
  "🙂", "🙃", "😉", "😇", "🥰", "😋", "😏", "😬", "🤗", "🤭",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "✌️", "🤞", "👌",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💔", "💯",
  "🔥", "✨", "🎉", "🎊", "🎈", "🎁", "🏆", "⭐", "💡", "✅",
  "☕", "🍕", "🍔", "🍎", "🍺", "🎂", "🚀", "⚽", "🎮", "📱",
];

export default function EmojiPicker({ onSelect }) {
  return (
    <div className="w-64 max-h-56 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-2 grid grid-cols-8 gap-0.5">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className="text-lg leading-none p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}