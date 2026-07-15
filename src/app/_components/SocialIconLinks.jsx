import { getRenderableSocialItems } from "@library/social/profile-url";

/**
 * @param {{
 *   items?: Array<{ link?: string, title?: string, icon?: string }>,
 *   className?: string,
 *   keyPrefix?: string,
 * }} props
 */
const SocialIconLinks = ({ items, className = "tst-icon-link", keyPrefix = "social-item" }) => {
  const renderable = getRenderableSocialItems(items);

  return renderable.map((item, key) => (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      title={item.title}
      className={className}
      key={`${keyPrefix}-${key}`}
    >
      <i className={item.icon}></i>
    </a>
  ));
};

export default SocialIconLinks;
