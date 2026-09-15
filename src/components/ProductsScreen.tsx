import React, { useState } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Image as ImageIcon,
  MoreVertical,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  PackagePlus,
} from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../utils/i18n';

interface ProductsScreenProps {
  products: Product[];
  onAddProductClick: () => void;
  onEditProductClick: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenRestockModal?: (productId?: string) => void;
  onOpenRealDataManager?: () => void;
  isDark?: boolean;
  canManageProducts?: boolean;
}

export const ProductsScreen: React.FC<ProductsScreenProps> = ({
  products,
  onAddProductClick,
  onEditProductClick,
  onDeleteProduct,
  onOpenRestockModal,
  onOpenRealDataManager,
  isDark,
  canManageProducts = true,
}) => {
  const { language, t, formatCurr } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const itemsPerPage = 8;

  // Extract dynamic categories from real products
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === 'in_stock') matchesStatus = p.stock > 10;
    else if (selectedStatus === 'low_stock') matchesStatus = p.stock > 0 && p.stock <= 10;
    else if (selectedStatus === 'out_of_stock') matchesStatus = p.stock === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const headers = language === 'vi' 
      ? 'Mã,Tên sản phẩm,Nhóm,Giá bán,Giá vốn,Tồn kho,Trạng thái\n'
      : 'Code,Product Name,Category,Selling Price,Cost Price,Stock,Status\n';
    const rows = products
      .map(
        (p) =>
          `"${p.code}","${p.name}","${p.category}",${p.price},${p.costPrice},${p.stock},"${
            p.stock === 0 ? t.stockStatusOut : p.stock <= 10 ? t.stockStatusLow : t.stockStatusIn
          }"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartSale_Products_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleImport = () => {
    if (onOpenRealDataManager) {
      onOpenRealDataManager();
    } else {
      alert(language === 'vi' ? 'Tính năng nhập file Excel (.xlsx / .csv): Bạn có thể kéo thả file danh sách sản phẩm.' : 'Excel (.xlsx / .csv) import ready.');
    }
  };

  return (
    <div id="products-screen" className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.productsTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-0.5 font-normal">
            {t.productsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-import-products"
            onClick={handleImport}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            <Upload className="w-4 h-4 text-slate-400 dark:text-slate-300" />
            <span>{t.importAction}</span>
          </button>

          <button
            id="btn-export-products"
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-xl border transition-colors ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50'
            }`}
          >
            <Download className="w-4 h-4 text-slate-400 dark:text-slate-300" />
            <span>{t.exportAction}</span>
          </button>

          {canManageProducts ? (
            <button
              id="btn-add-product-main"
              onClick={onAddProductClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addProduct}</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold">
              {language === 'vi' ? 'Chế độ tra cứu giá' : 'Read-only Catalog'}
            </span>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div
        id="products-filter-card"
        className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center gap-3 transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="products-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchProductPlaceholder}
            className={`w-full pl-10 pr-4 py-2 text-sm rounded-xl border outline-none ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Category Dropdown */}
        <div className="w-full md:w-44">
          <select
            id="filter-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full py-2 px-3 text-sm rounded-xl border outline-none cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-44">
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`w-full py-2 px-3 text-sm rounded-xl border outline-none cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">{t.allStatuses}</option>
            <option value="in_stock">{t.stockStatusIn}</option>
            <option value="low_stock">{t.stockStatusLow}</option>
            <option value="out_of_stock">{t.stockStatusOut}</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div
        id="products-table-card"
        className={`rounded-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr
                className={`text-xs font-bold uppercase tracking-wider border-b ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <th className="py-3 px-4 w-14 text-center">{language === 'vi' ? 'Ảnh' : 'Image'}</th>
                <th className="py-3 px-4 font-bold">{t.productCode}</th>
                <th className="py-3 px-4 font-bold">{t.productName}</th>
                <th className="py-3 px-4 font-bold">{t.productCategory}</th>
                <th className="py-3 px-4 font-bold text-right">{t.productPrice}</th>
                <th className="py-3 px-4 font-bold text-center">{t.productStock}</th>
                <th className="py-3 px-4 font-bold text-center">{t.productStatus}</th>
                <th className="py-3 px-4 font-bold text-center w-24">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-300 font-medium">
                    {products.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {language === 'vi' ? 'Kho hàng hiện tại đang trống' : 'Inventory is currently empty'}
                        </p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {language === 'vi'
                            ? 'Bạn có thể nhập danh sách sản phẩm từ file Excel/CSV hoặc thêm từng sản phẩm mới.'
                            : 'You can import your real product list via Excel/CSV or add individual products.'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {onOpenRealDataManager && (
                            <button
                              onClick={onOpenRealDataManager}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{language === 'vi' ? 'Nhập hàng nhanh (CSV/Excel)' : 'Quick Import (CSV/Excel)'}</span>
                            </button>
                          )}
                          <button
                            onClick={onAddProductClick}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t.addProduct}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      t.noMatchingProducts
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const isLow = product.stock > 0 && product.stock <= 10;
                  const isOut = product.stock === 0;

                  return (
                    <tr
                      key={product.id}
                      id={`product-row-${product.id}`}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="w-11 h-11 mx-auto rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-4 font-semibold text-xs text-slate-600 dark:text-slate-300">
                        {product.code}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {product.name}
                        </span>
                        {product.sku && (
                          <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            SKU: {product.sku}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-200 font-medium">
                        {product.category}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-xs text-slate-900 dark:text-white">
                        {formatCurr(product.price)}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-900 dark:text-white">
                        <span
                          className={
                            isOut
                              ? 'text-red-500 font-extrabold'
                              : isLow
                              ? 'text-amber-500 dark:text-amber-400 font-extrabold'
                              : 'text-slate-800 dark:text-slate-200'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border dark:border-red-800/40">
                            {t.stockStatusOut}
                          </span>
                        ) : isLow ? (
                          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border dark:border-amber-800/40">
                            {t.stockStatusLow}
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border dark:border-emerald-800/40">
                            {t.stockStatusIn}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {canManageProducts ? (
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            {onOpenRestockModal && (
                              <button
                                id={`btn-product-restock-${product.id}`}
                                onClick={() => onOpenRestockModal(product.id)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title={t.restockNow}
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditProductClick(product)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors"
                              title={t.edit}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              id={`btn-delete-product-${product.id}`}
                              onClick={() => setDeletingProduct(product)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-500 hover:text-red-600 transition-colors"
                              title={t.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div
          id="products-pagination"
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            isDark
              ? 'border-slate-800 text-slate-400'
              : 'border-slate-100 text-slate-500 bg-slate-50/50'
          }`}
        >
          <div>
            {language === 'vi' ? (
              <>
                Hiển thị <span className="font-semibold text-slate-900 dark:text-white">1-{paginatedProducts.length}</span> trong số{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> sản phẩm
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-slate-900 dark:text-white">1-{paginatedProducts.length}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{filteredProducts.length}</span> products
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {page}
              </button>
            ))}

            {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative ${
              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'vi' ? 'Xác nhận xóa sản phẩm' : 'Confirm Product Deletion'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'vi' ? 'Hành động này sẽ xóa sản phẩm khỏi kho hàng vĩnh viễn' : 'This will remove the product permanently'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Tên sản phẩm:</span>
                <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[220px] truncate">{deletingProduct.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Mã SKU / Code:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{deletingProduct.sku || deletingProduct.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Giá bán:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurr(deletingProduct.price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Số lượng tồn kho:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{deletingProduct.stock} cái</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-cancel-delete-product"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                id="btn-confirm-delete-product"
                onClick={() => {
                  const id = deletingProduct.id;
                  setDeletingProduct(null);
                  onDeleteProduct(id);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'vi' ? 'Xóa vĩnh viễn' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
