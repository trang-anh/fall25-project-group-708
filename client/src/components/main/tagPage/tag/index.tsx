import './index.css';
import { TagData } from '../../../../types/types';
import useTagSelected from '../../../../hooks/useTagSelected';

/**
 * Props for the Tag component.
 *
 * t - The tag object.
 * clickTag - Function to handle the tag click event.
 */
interface TagProps {
  t: TagData;
  clickTag: (tagName: string) => void;
}

/**
 * Tag component that displays information about a specific tag.
 * The component displays the tag's name and question count in a pill-shaped button.
 * It also triggers a click event to handle tag selection.
 *
 * @param t - The tag object.
 * @param clickTag - Function to handle tag clicks.
 */
const TagView = ({ t, clickTag }: TagProps) => {
  const { tag } = useTagSelected(t);

  return (
    <button
      className='tagNode'
      onClick={() => {
        clickTag(t.name);
      }}
      aria-label={`Filter by ${tag.name} tag`}
      title={tag.description}>
      <span className='tagName'>{tag.name}</span>
      {t.qcnt > 0 && <span className='tagCount'>{t.qcnt}</span>}
    </button>
  );
};

export default TagView;
