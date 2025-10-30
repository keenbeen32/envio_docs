// Add unique icons to sidebar group headings
(function() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSidebarIcons);
  } else {
    addSidebarIcons();
  }

  function addSidebarIcons() {
    // Map group names to simple text symbols
    const iconMap = {
      'Introduction': '›',
      'Guides': '≡',
      'Examples': '◦',
      'Hosting': '↑',
      'Tutorials': '⌘',
      'Advanced': '⚙',
      'Troubleshoot': '⚠',
      'Supported Networks': '◉',
      'Other': '···',
      'Getting started': '›',
      'Projects': '□',
      'Articles': '≡'
    };

    // Find all sidebar group titles
    const groupTitles = document.querySelectorAll('.sidebar-group-header h5#sidebar-title');
    
    groupTitles.forEach(title => {
      const text = title.textContent.trim();
      const icon = iconMap[text];
      
      if (icon && !title.dataset.iconAdded) {
        // Create icon span
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon + ' ';
        iconSpan.style.marginRight = '6px';
        iconSpan.style.fontSize = '13px';
        iconSpan.style.opacity = '1';
        iconSpan.style.fontWeight = '800';
        iconSpan.style.display = 'inline-block';
        iconSpan.style.width = '16px';
        
        // Insert icon before text
        title.insertBefore(iconSpan, title.firstChild);
        title.dataset.iconAdded = 'true';
      }
    });
  }

  // Re-run when navigation changes (for SPAs)
  const observer = new MutationObserver(() => {
    addSidebarIcons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

