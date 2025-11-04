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
      'Getting Started': '›',
      'Getting started': '›',
      'Core Features': '■',
      'HyperFuel': '▸',
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
    setupCollapsibleGroups();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Setup collapsible groups functionality
  function setupCollapsibleGroups() {
    const groupHeaders = document.querySelectorAll('.sidebar-group-header');
    
    groupHeaders.forEach(header => {
      // Skip if already set up
      if (header.dataset.collapsibleSetup === 'true') {
        return;
      }
      
      const title = header.querySelector('h5#sidebar-title');
      if (!title) return;
      
      // Get group name - get text from non-span nodes (excluding icon)
      let groupName = '';
      const textNodes = Array.from(title.childNodes).filter(node => {
        if (node.nodeType === Node.TEXT_NODE) return true;
        if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SPAN') return true;
        return false;
      });
      
      if (textNodes.length > 0) {
        groupName = textNodes.map(n => n.textContent).join('').trim();
      } else {
        // Fallback: use textContent and remove icon characters
        groupName = title.textContent.trim();
        groupName = groupName.replace(/^[›≡◦↑⌘⚙⚠◉···□]\s*/, '').trim();
      }
      
      // Ensure we have a clean group name
      groupName = groupName.replace(/^[›≡◦↑⌘⚙⚠◉···□]\s*/, '').trim();
      
      const isSupportedNetworks = groupName === 'Supported Networks';
      
      // Find the parent group container - use closest to find the container with mt-6 or lg:mt-8 classes
      let groupContainer = header.closest('[class*="mt-6"]');
      if (!groupContainer) {
        groupContainer = header.closest('[class*="lg:mt-8"]');
      }
      if (!groupContainer) {
        // Fallback: find parent that contains ul or #sidebar-group
        groupContainer = header.parentElement;
        let depth = 0;
        while (groupContainer && groupContainer !== document.body && depth < 5) {
          if (groupContainer.querySelector('ul, #sidebar-group')) {
            break;
          }
          groupContainer = groupContainer.parentElement;
          depth++;
        }
      }
      
      // Final fallback
      if (!groupContainer || groupContainer === document.body) {
        groupContainer = header.parentElement;
      }
      
      // Set initial state: collapsed for Supported Networks, expanded for others
      if (isSupportedNetworks) {
        groupContainer.classList.add('collapsed');
        header.classList.add('collapsed');
      } else {
        // Ensure it starts expanded
        groupContainer.classList.remove('collapsed');
        header.classList.remove('collapsed');
      }
      
      // Add click handler
      header.addEventListener('click', function(e) {
        // Don't toggle if clicking on a link
        if (e.target.closest('a')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle collapsed state
        const isCollapsed = groupContainer.classList.contains('collapsed');
        
        if (isCollapsed) {
          groupContainer.classList.remove('collapsed');
          header.classList.remove('collapsed');
        } else {
          groupContainer.classList.add('collapsed');
          header.classList.add('collapsed');
        }
      });
      
      header.dataset.collapsibleSetup = 'true';
    });
  }

  // Initial setup - run after icons are added
  setTimeout(() => {
    setupCollapsibleGroups();
  }, 100);
  
  // Also run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCollapsibleGroups);
  } else {
    setupCollapsibleGroups();
  }
})();

