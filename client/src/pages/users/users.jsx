
import ReusableTable from "../../components/ui/reusableTable";
import useUser from "../../lib/hooks/useUser";
import { useEffect, useState } from "react";
import moment from "moment";
import Header from "./components/header";
import UploadModal from "../../components/UploadModal";
import UserFormModal from "../../components/UserFormModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import useOrganisation from "../../lib/hooks/useOrganisation";
import { hashDevicePasswords } from "../../utils/passwordHasher";


export default function UsersPage() {
    const [selectedUser, setSelectedUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const { fetchOrganisations, organisations } = useOrganisation();
    const columns = [
        { key: 'name', label: 'Name', align: 'left' },
        { key: 'role', label: 'Role', align: 'left' },
        { key: 'status', label: 'Status', align: 'center' },
        { key: 'organisation', label: 'Organisation', align: 'left' },
        {
            key: 'createdAt',
            label: 'Created Date',
            align: 'center',
            render: (value) => value ? moment(value).format('DD MMM YYYY') : '-'
        },
        {
            key: 'lastLogin',
            label: 'Last Login',
            align: 'center',
            render: (value) => value ? moment(value).format('DD MMM YYYY, hh:mm A') : 'Never'
        },
    ];

    const { users, fetchUsers, loading, filter, error, mode, setMode, createUser, updateUser, deleteUser, uploadUser, updateUserStatus, setFilters } = useUser();

    useEffect(() => {
        fetchUsers({ skip: 0, take: 10, filter: filter });
        // Fetch organisations for the dropdown
        fetchOrganisations();
    }, [fetchUsers, filter]);

    const handleCreate = () => {
        setSelectedUser(null);
        setMode('create');
    };

    const handleEdit = (row) => {
        setSelectedUser(row);
        setMode('edit');
    };

    const handleDelete = (row) => {
        setUserToDelete(row);
        setMode('delete');
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteUser(userToDelete.id);
                setUserToDelete(null);
                setMode(null);
                // Refresh the list
                fetchUsers({ skip: 0, take: 10 });
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (mode === 'create') {
                await createUser(formData);
            } else if (mode === 'edit') {
                await updateUser({ ...formData, id: selectedUser.id });
            }
            // Refresh the list
            fetchUsers({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error submitting form:", error);
            throw error; // Re-throw to let the form handle it
        }
    };

    const handleUpload = async (data) => {
        try {
            // Hash passwords before sending to server
            console.log("Original data:", data);
            
            const hashedData = await hashDevicePasswords(
                data,
                (progress) => {
                    console.log(`Hashing progress: ${progress.current}/${progress.total}`);
                },
                10 // saltRounds
            );
            
            console.log("Hashed data:", hashedData);
            
            await uploadUser(hashedData);
            // Close modal and refresh the list
            setUploadModalOpen(false);  
            setMode(null);
            fetchUsers({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error uploading users:", error);
            throw error;
        }
    };

 
    const handleFilterChange = (status) => {
        // TODO: Implement filtering logic based on status
        console.log('Filter users by status:', status);
        // You can add filtering logic here when ready
        // fetchUsers({ skip: 0, take: 10, status });
    };

    const handleSearchChange = (search) => {
        // TODO: Implement search logic
        console.log('Search users:', search);
        // You can add search logic here when ready
        // fetchUsers({ skip: 0, take: 10, search });
    };

    const handleUploadClick = () => {
        setMode('upload');
        setUploadModalOpen(true);
    };
    
    return (
        <section className="space-y-3">
            <Header
                onAddUser={handleCreate}
                onUploadUsers={handleUploadClick}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
            />

            <div className="px-6">
                {loading ? (
                    <div>Loading users...</div>
                ) : error ? (
                    <div className="text-red-500">Error: {error?.message || error}</div>
                ) : (
                    <ReusableTable
                        columns={columns}
                        data={users || []}
                        title="Users"
                        headerColor="bg-gray-700"
                        headerTextColor="text-white"
                        bordered
                        searchPlaceholder="Search users..."
                        onAdd={handleCreate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Create/Edit User Modal */}
            <UserFormModal
                open={mode === 'create' || mode === 'edit'}
                onOpenChange={(isOpen) => !isOpen && setMode(null)}
                onSubmit={handleFormSubmit}
                initialData={selectedUser}
                mode={mode === 'edit' ? 'edit' : 'create'}
            />

            {/* Upload Modal */}
            <UploadModal
                title="Upload Users"
                description="Upload an Excel file to add multiple users at once."
                open={uploadModalOpen && mode === 'upload'}
                onOpenChange={(isOpen) => {
                    console.log('Users upload modal onOpenChange called with isOpen:', isOpen);
                    if (!isOpen) {
                        console.log('Closing users upload modal, setting mode to null');
                        // Use local state to immediately close the modal
                        setUploadModalOpen(false);
                        // Also update Redux state
                        setMode(null);
                    }
                }}
                uploadDevice={handleUpload}
                requiredColumns={['name', 'phone', 'password', 'email (optional)', 'role', 'organisationCode', 'status']}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={mode === 'delete'}
                title="Delete User"
                description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setUserToDelete(null);
                    setMode(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
                danger={true}
            />
        </section>
    );
}


