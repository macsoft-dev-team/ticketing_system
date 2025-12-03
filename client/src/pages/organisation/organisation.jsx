import ReusableTable from "../../components/ui/reusableTable";
import useOrganisation from "../../lib/hooks/useOrganisation";
import { useEffect, useState, useCallback } from "react";
import moment from "moment";
import Header from "./components/header";
import UploadModal from "../../components/UploadModal";
import OrganisationFormModal from "../../components/OrganisationFormModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { debounceSearch } from "../../utils/debounce";

export default function OrganisationPage() {
    const [selectedOrganisation, setSelectedOrganisation] = useState(null);
    const [organisationToDelete, setOrganisationToDelete] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    
    const columns = [
        { key: 'name', label: 'Name', align: 'left' ,textWrap:"nowrap"},
        { key: 'orgCode', label: 'Customer Code', align: 'left' ,textWrap:"nowrap"},
        { key: 'address', label: 'Address', align: 'left' ,textWrap:"nowrap"},
        { key: 'email', label: 'Email', align: 'left' ,textWrap:"nowrap"},
        { key: 'phone', label: 'Phone', align: 'left' ,textWrap:"nowrap"},
        { key: 'status', label: 'Status', align: 'center' ,textWrap:"nowrap"},
        {
            key: 'createdAt',
            label: 'Created Date',
            align: 'start ',
            textWrap:"nowrap"
         },
    ];

    const { 
        organisations, 
        fetchOrganisations, 
        loading, 
        filter, 
        error, 
        mode, 
        setMode, 
        createOrganisation, 
        updateOrganisation, 
        deleteOrganisation, 
        setFilters,
        statusCounts 
    } = useOrganisation();

    useEffect(() => {
        fetchOrganisations({ skip: 0, take: 10, filter: filter });
    }, [fetchOrganisations, filter]);

    const handleCreate = () => {
        setSelectedOrganisation(null);
        setMode('create');
        setModalOpen(true);
    };

    const handleEdit = (row) => {
        setSelectedOrganisation(row);
        setMode('edit');
        setModalOpen(true);
    };

    const handleDelete = (row) => {
        setOrganisationToDelete(row);
        setMode('delete');
    };

    const confirmDelete = async () => {
        if (organisationToDelete) {
            try {
                await deleteOrganisation(organisationToDelete.id);
                setOrganisationToDelete(null);
                setMode(null);
                // Refresh the list
                fetchOrganisations({ skip: 0, take: 10, filter });
            } catch (error) {
                console.error("Error deleting organisation:", error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            let result;
            if (mode === 'create') {
                result = await createOrganisation(formData);
            } else if (mode === 'edit') {
                result = await updateOrganisation({ 
                    id: selectedOrganisation.id, 
                    organisationData: formData 
                });
            }
            
            // Only close modal and refresh on successful submission
            if (result) {
                setModalOpen(false);
                setMode(null);
                setSelectedOrganisation(null);
                // Refresh the list
                fetchOrganisations({ skip: 0, take: 10, filter });
            }
        } catch (error) {
            // Don't close the modal on error - let user see the error and try again
            throw error; // Re-throw to let the form handle it
        }
    };

    const handleUpload = async (data) => {
        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('organisations', JSON.stringify(data));

            // Note: Upload functionality would need to be implemented in the hook
            // await uploadOrganisation(formData);         
            // Close modal and refresh the list
            setUploadModalOpen(false);
            setMode(null);
            fetchOrganisations({ skip: 0, take: 10, filter });
        } catch (error) {
            throw error;
        }
    };

    const handleStatusToggle = async (row) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await updateOrganisation({ 
                id: row.id,
                organisationData: {
                    name: row.name,
                    orgCode: row.orgCode, 
                    address: row.address,
                    email: row.email,
                    phone: row.phone,
                    status: newStatus 
                }
            });
            // Refresh the list
            fetchOrganisations({ skip: 0, take: 10, filter });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleFilterChange = (status) => {
         const updatedFilter = { ...filter, status };
        setFilters(updatedFilter);
        fetchOrganisations({ skip: 0, take: 10, filter: updatedFilter });
    };

    // Create a debounced search function
    const debouncedSearch = useCallback(
        debounceSearch((searchTerm) => {
             const updatedFilter = { ...filter, search: searchTerm };
            setFilters(updatedFilter);
            fetchOrganisations({ skip: 0, take: 10, filter: updatedFilter });
        }, 500),
        [filter, fetchOrganisations, setFilters]
    );

    const handleSearchChange = (search) => {
        // Call the debounced search function
        debouncedSearch(search);
    };

    const handleUploadClick = () => {
        setMode('upload');
        setUploadModalOpen(true);
    };

    // Transform organisations data to match expected format
    const transformedData = organisations?.map(org => ({
        ...org,
        status: org.isActive ? 'ACTIVE' : 'INACTIVE'
    })) || [];

    return (
        <section className="space-y-3">
            <Header
                onAddOrganisation={handleCreate}
                onUploadOrganisations={handleUploadClick}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
            />

            <div className="px-6">
                {loading ? (
                    <div>Loading Customers...</div>
                ) : error ? (
                    <div className="text-red-500">Error: {error?.message || error}</div>
                ) : (
                    <ReusableTable
                        columns={columns}
                        data={transformedData}
                        title="Customers"
                        headerColor="bg-gray-700"
                        headerTextColor="text-white"
                        bordered
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Create/Edit Organisation Modal */}
            <OrganisationFormModal
                open={modalOpen && (mode === 'create' || mode === 'edit')}
                onOpenChange={(isOpen) => {
                     if (!isOpen) {
                         // Use local state to immediately close the modal
                        setModalOpen(false);
                        // Also update Redux state
                        setMode(null);
                        setSelectedOrganisation(null);
                    }
                }}
                onSubmit={handleFormSubmit}
                initialData={selectedOrganisation}
                mode={mode === 'edit' ? 'edit' : 'create'}
            />

            {/* Upload Modal */}
            <UploadModal
                title="Upload Customers"
                description="Upload an Excel file to add multiple Customers at once."
                open={uploadModalOpen && mode === 'upload'}
                onOpenChange={(isOpen) => {
                     if (!isOpen) {
                         // Use local state to immediately close the modal
                        setUploadModalOpen(false);
                        // Also update Redux state
                        setMode(null);
                    }
                }}
                uploadDevice={handleUpload}
                requiredColumns={['name', 'orgCode', 'address', 'email', 'phone', 'status']}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={mode === 'delete'}
                title="Delete Customer"
                description={`Are you sure you want to delete ${organisationToDelete?.name}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setOrganisationToDelete(null);
                    setMode(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
                danger={true}
            />
        </section>
    );
}
