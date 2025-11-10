// FILE: /pages/seller/catalogue.tsx                    >
.catalogue-actions-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 20px;
}

.catalogue-button {
  display: inline-block;
  border-radius: 6px;
  background: #2563eb; /* blue-600 */
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  color: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  text-decoration: none;
  transition: background-color 150ms;
}
.catalogue-button:hover {
  background: #1d4ed8; /* blue-700 */
}

.catalogue-button-secondary {
  display: inline-block;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  background: #ffffff;
  color: #374151; /* gray-700 */
  border: 1px solid #e5e7eb; /* gray-200 */
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 150ms;
}
.catalogue-button-secondary:hover {
  background: #f9fafb; /* gray-50 */
  border-color: #d1d5db; /* gray-300 */
}

.catalogue-table-wrapper {
  border-radius: 8px;
  border: 1px solid #e5e7eb; /* gray-200 */
  background: #ffffff;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  overflow: hidden; /* To get rounded corners on the table */
}

.catalogue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #111827; /* gray-900 */
}

.catalogue-table th,
.catalogue-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb; /* gray-200 */
}

.catalogue-table th {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563; /* gray-600 */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f9fafb; /* gray-50 */
}

.catalogue-table tr:last-child td {
  border-bottom: none;
}

.catalogue-table-actions {
  display: flex;
  gap: 16px;
}

.catalogue-table-button {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb; /* blue-600 */
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.catalogue-table-button:hover {
  color: #1d4ed8; /* blue-700 */
  text-decoration: underline;
}
.catalogue-table-button.delete {
  color: #dc2626; /* red-600 */
}
.catalogue-table-button.delete:hover {
  color: #b91c1c; /* red-700 */
}

/* --- END: CUSTOM CSS FOR /seller/catalogue --- */
