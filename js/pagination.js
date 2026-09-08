/**
 * Managely Universal Pagination Component
 * Provides clean pagination slicing and modern UI controls for data tables.
 */

/**
 * Slices an array based on page and pageSize
 * @param {Array} items 
 * @param {number} page 
 * @param {number} pageSize 
 * @returns {Object} { pageItems, totalItems, totalPages, currentPage, pageSize, startItem, endItem }
 */
export function paginateArray(items, page = 1, pageSize = 10) {
    const list = Array.isArray(items) ? items : [];
    const totalItems = list.length;
    const size = Math.max(1, parseInt(pageSize) || 10);
    const totalPages = Math.max(1, Math.ceil(totalItems / size));
    const currentPage = Math.min(Math.max(1, parseInt(page) || 1), totalPages);

    const startIndex = (currentPage - 1) * size;
    const endIndex = Math.min(startIndex + size, totalItems);
    const pageItems = list.slice(startIndex, endIndex);

    return {
        pageItems,
        totalItems,
        totalPages,
        currentPage,
        pageSize: size,
        startItem: totalItems === 0 ? 0 : startIndex + 1,
        endItem: endIndex
    };
}

/**
 * Generates an array of page numbers with ellipsis
 * @param {number} current 
 * @param {number} total 
 * @returns {Array<number|string>} e.g. [1, '...', 4, 5, 6, '...', 12]
 */
export function generatePageNumbers(current, total) {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = [];
    const delta = 1;

    pages.push(1);

    const left = current - delta;
    const right = current + delta;

    if (left > 2) {
        pages.push("...");
    }

    for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) {
        pages.push(i);
    }

    if (right < total - 1) {
        pages.push("...");
    }

    if (total > 1) {
        pages.push(total);
    }

    return pages;
}

/**
 * Renders pagination UI into the target container
 * @param {Object} options
 * @param {HTMLElement|string} options.container - Container element or ID
 * @param {number} options.totalItems - Total number of records
 * @param {number} options.currentPage - Current active page (1-based)
 * @param {number} options.pageSize - Number of items per page
 * @param {Function} options.onPageChange - Callback (page, pageSize) => void
 * @param {Array<number>} [options.pageSizeOptions] - [10, 25, 50, 100]
 */
export function renderPagination({
    container,
    totalItems = 0,
    currentPage = 1,
    pageSize = 10,
    onPageChange,
    pageSizeOptions = [10, 25, 50, 100]
}) {
    const el = typeof container === "string" ? document.getElementById(container) : container;
    if (!el) return;

    if (totalItems <= 0) {
        el.innerHTML = "";
        el.style.display = "none";
        return;
    }

    el.style.display = "block";
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currPage = Math.min(Math.max(1, currentPage), totalPages);
    const startItem = totalItems === 0 ? 0 : (currPage - 1) * pageSize + 1;
    const endItem = Math.min(currPage * pageSize, totalItems);

    const pageNumbers = generatePageNumbers(currPage, totalPages);

    const pageSizeId = `pag-size-${container}`;

    const html = `
        <div class="managely-pagination-wrapper px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-5 rounded-xl border border-purple-100 shadow-sm mt-4 select-none" style="background:linear-gradient(135deg,#fdfcff 0%,#f5f3ff 100%);border-top:2px solid #7c3aed22;">
            <!-- Left: Info & Page Size -->
            <div class="flex items-center gap-3 text-sm text-gray-600 order-2 sm:order-1">
                <span class="font-medium text-gray-700">
                    عرض <strong class="text-primary font-bold">${startItem}</strong> - <strong class="text-primary font-bold">${endItem}</strong> من إجمالي <strong class="text-gray-900 font-bold">${totalItems}</strong> سجل
                </span>
                <span class="text-gray-300">|</span>
                <div class="flex items-center gap-1.5 text-xs text-gray-500">
                    <span class="whitespace-nowrap">لكل صفحة</span>
                    <!-- Custom page-size dropdown -->
                    <div class="pagination-size-dropdown p-3" id="${pageSizeId}" style="position:relative;display:inline-block;">
                        <button type="button" class="pagination-size-trigger flex items-center gap-1 px-3 py-2 rounded-md border border-primary/40 bg-white text-primary font-bold text-xs hover:bg-primary/5 transition-all" style="min-width:56px;justify-content:space-between;">
                            <span class="size-label">${pageSize}</span>
                            <i class="fas fa-chevron-up text-[9px] size-arrow" style="transition:transform 0.2s;"></i>
                        </button>
                        <div class="size-options" style="display:none;position:fixed;background:#fff;border:1.5px solid #e9d5ff;border-radius:12px;box-shadow:0 8px 32px rgba(109,40,217,0.18);z-index:99999;min-width:80px;padding:6px;overflow:hidden;">
                            ${pageSizeOptions.map(size => `
                                <div class="size-option flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${size === pageSize ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'}" data-size="${size}">
                                    ${size === pageSize ? '<i class="fas fa-check text-primary" style="font-size:9px;"></i>' : '<span style="width:11px;display:inline-block;"></span>'}
                                    ${size}
                                </div>`).join("")}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right: Navigation Buttons -->
            <div class="flex items-center gap-1 order-1 sm:order-2">
                <!-- First Page -->
                <button type="button" class="pagination-btn pagination-first px-3 h-8 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-35 disabled:pointer-events-none" ${currPage === 1 ? "disabled" : ""} data-page="1" title="الصفحة الأولى">
                    <i class="fas fa-angles-right"></i>
                </button>

                <!-- Previous Page -->
                <button type="button" class="pagination-btn pagination-prev px-3 h-8 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-35 disabled:pointer-events-none flex items-center gap-1" ${currPage === 1 ? "disabled" : ""} data-page="${currPage - 1}" title="الصفحة السابقة">
                    <i class="fas fa-chevron-right text-[10px]"></i>
                    <span class="hidden md:inline">السابق</span>
                </button>

                <!-- Number Buttons -->
                <div class="flex items-center gap-1 mx-1">
                    ${pageNumbers.map(p => {
        if (p === "...") {
            return `<span class="px-2 py-1 text-xs text-gray-400 font-bold tracking-widest">...</span>`;
        }
        const isActive = p === currPage;
        return `
                        <button type="button" class="pagination-btn pagination-num w-8 h-8 rounded-lg text-xs font-bold transition-all ${isActive
                ? "bg-primary text-white shadow-md shadow-primary/30 border-primary cursor-default"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-primary/50 hover:text-primary"
            }" data-page="${p}">${p}</button>`;
    }).join("")}
                </div>

                <!-- Next Page -->
                <button type="button" class="pagination-btn pagination-next px-3 h-8 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-35 disabled:pointer-events-none flex items-center gap-1" ${currPage === totalPages ? "disabled" : ""} data-page="${currPage + 1}" title="الصفحة التالية">
                    <span class="hidden md:inline">التالي</span>
                    <i class="fas fa-chevron-left text-[10px]"></i>
                </button>

                <!-- Last Page -->
                <button type="button" class="pagination-btn pagination-last px-3 h-8 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary transition-all disabled:opacity-35 disabled:pointer-events-none" ${currPage === totalPages ? "disabled" : ""} data-page="${totalPages}" title="الصفحة الأخيرة">
                    <i class="fas fa-angles-left"></i>
                </button>
            </div>
        </div>
    `;

    el.innerHTML = html;

    // Attach page nav button listeners
    el.querySelectorAll(".pagination-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const targetPage = parseInt(btn.getAttribute("data-page"));
            if (targetPage && targetPage !== currPage && typeof onPageChange === "function") {
                onPageChange(targetPage, pageSize);
            }
        });
    });

    // Custom page-size dropdown logic
    const dropdownEl = document.getElementById(pageSizeId);
    if (dropdownEl) {
        const trigger = dropdownEl.querySelector(".pagination-size-trigger");
        const optionsPanel = dropdownEl.querySelector(".size-options");
        const arrow = dropdownEl.querySelector(".size-arrow");

        function openDropdown() {
            const rect = trigger.getBoundingClientRect();

            // Show invisibly first to measure actual height
            optionsPanel.style.visibility = "hidden";
            optionsPanel.style.display = "block";

            const panelHeight = optionsPanel.offsetHeight;
            const panelWidth = optionsPanel.offsetWidth;

            // Align right edge of dropdown with right edge of trigger (RTL-friendly)
            const rightEdge = window.innerWidth - rect.right;
            optionsPanel.style.left = "auto";
            optionsPanel.style.right = rightEdge + "px";

            // Place above if space allows, else below — 2px gap only
            const spaceAbove = rect.top;
            if (spaceAbove >= panelHeight + 2) {
                optionsPanel.style.top = (rect.top - panelHeight - 2) + "px";
            } else {
                optionsPanel.style.top = (rect.bottom + 2) + "px";
            }

            optionsPanel.style.visibility = "visible";
            arrow.style.transform = "rotate(180deg)";
        }


        function closeDropdown() {
            optionsPanel.style.display = "none";
            arrow.style.transform = "rotate(0deg)";
        }

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = optionsPanel.style.display === "block";
            isOpen ? closeDropdown() : openDropdown();
        });

        dropdownEl.querySelectorAll(".size-option").forEach(opt => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                const newSize = parseInt(opt.getAttribute("data-size")) || 10;
                closeDropdown();
                if (typeof onPageChange === "function") {
                    onPageChange(1, newSize);
                }
            });
        });

        // Close on outside click or Escape
        function handleOutside(e) {
            if (!dropdownEl.contains(e.target)) closeDropdown();
        }
        function handleEsc(e) {
            if (e.key === "Escape") closeDropdown();
        }
        document.addEventListener("click", handleOutside);
        document.addEventListener("keydown", handleEsc);
    }
}


// Global attachment for non-module script usage
if (typeof window !== "undefined") {
    window.paginateArray = paginateArray;
    window.generatePageNumbers = generatePageNumbers;
    window.renderPagination = renderPagination;
}
