import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// رابط لقسم في الصفحة الرئيسية يعمل من أي صفحة:
// في الرئيسية يبقى رابط #id عادي، وفي غيرها ينتقل إلى /#id (وHome يتكفل بالتمرير)
function SectionLink({ id, children, ...props }) {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return <a href={`#${id}`} {...props}>{children}</a>;
  }

  return <Link to={`/#${id}`} {...props}>{children}</Link>;
}

export default SectionLink;
