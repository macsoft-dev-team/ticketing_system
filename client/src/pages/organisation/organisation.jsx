import ReusableTable from "../../components/ui/reusableTable";
import useOrganisation from "../../lib/hooks/useOrganisation";
import { useEffect, useState } from "react";
import moment from "moment";
import Header from "./components/header";
import UploadModal from "../../components/UploadModal";
import OrganisationFormModal from "../../components/OrganisationFormModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

export default function OrganisationPage() {
    const [selectedOrganisation, setSelectedOrganisation] = useState(null);
    const [organisationToDelete, setOrganisationToDelete] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    
    const columns = [
        { key: 'name', label: 'Name', align: 'left' },
        { key: 'orgCode', label: 'Organization Code', align: 'left' },
        { key: 'address', label: 'Address', align: 'left' },
        { key: 'email', label: 'Email', align: 'left' },
        { key: 'phone', label: 'Phone', align: 'left' },
        { key: 'status', label: 'Status', align: 'center' },
        {
            key: 'createdAt',
            label: 'Created Date',
            align: 'center',
            render: (value) => value ? moment(value).format('DD MMM YYYY') : '-'
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
        setFilters 
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
                fetchOrganisations({ skip: 0, take: 10 });
            } catch (error) {
                console.error("Error deleting organisation:", error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (mode === 'create') {
                await createOrganisation(formData);
            } else if (mode === 'edit') {
                await updateOrganisation({ ...formData, id: selectedOrganisation.id });
            }
            // Close modal and reset state
            setModalOpen(false);
            setMode(null);
            setSelectedOrganisation(null);
            // Refresh the list
            fetchOrganisations({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error submitting form:", error);
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
            console.log("Upload organisations:", data);
            
            // Close modal and refresh the list
            setUploadModalOpen(false);
            setMode(null);
            fetchOrganisations({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error uploading organisations:", error);
            throw error;
        }
    };

    const handleStatusToggle = async (row) => {
        const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        try {
            await updateOrganisation({ ...row, status: newStatus });
            // Refresh the list
            fetchOrganisations({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleFilterChange = (status) => {
        console.log('Filter organisations by status:', status);
        setFilters({ ...filter, status });
    };

    const handleSearchChange = (search) => {
        console.log('Search organisations:', search);
        setFilters({ ...filter, search });
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
                    <div>Loading organisations...</div>
                ) : error ? (
                    <div className="text-red-500">Error: {error?.message || error}</div>
                ) : (
                    <ReusableTable
                        columns={columns}
                        data={transformedData}
                        title="Organisations"
                        headerColor="bg-gray-700"
                        headerTextColor="text-white"
                        bordered
                        searchPlaceholder="Search organisations..."
                        onAdd={handleCreate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Create/Edit Organisation Modal */}
            <OrganisationFormModal
                open={modalOpen && (mode === 'create' || mode === 'edit')}
                onOpenChange={(isOpen) => {
                    console.log('Organisation modal onOpenChange called with isOpen:', isOpen);
                    if (!isOpen) {
                        console.log('Closing organisation modal, setting mode to null');
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
                title="Upload Organisations"
                description="Upload an Excel file to add multiple organisations at once."
                open={uploadModalOpen && mode === 'upload'}
                onOpenChange={(isOpen) => {
                    console.log('Upload modal onOpenChange called with isOpen:', isOpen);
                    if (!isOpen) {
                        console.log('Closing upload modal, setting mode to null');
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
                title="Delete Organisation"
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
