import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AddNoteButton.module.css';

interface AddNoteButtonProps {
  onClick: () => void;
}

export default function AddNoteButton({ onClick }: AddNoteButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
  };

  const buttonClasses = `${styles.addButton} ${isHovered ? styles.hovered : ''}`;

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={buttonClasses}
    >
      <img 
        src="/apple-touch-icon.png" 
        alt="Add Note" 
        className={styles.icon}
      />
    </button>
  );
}
