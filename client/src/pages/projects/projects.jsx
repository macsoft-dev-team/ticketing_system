import ReusableTable from "../../components/ui/reusableTable";
import useProject from "../../lib/hooks/useProject";
import { useEffect, useState, useCallback } from "react";
import moment from "moment";
import Header from "./components/header";
import UploadModal from "../../components/UploadModal";
import ProjectFormModal from "../../components/ProjectFormModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { debounceSearch } from "../../utils/debounce";

export default function Projects() {
    const [selectedProject, setSelectedProject] = useState(null);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const columns = [
        { key: 'name', label: 'Name', align: 'left' },
        { key: 'projectCode', label: 'Project Code', align: 'left' },
        { key: 'email', label: 'Email', align: 'left' },
        { key: 'address', label: 'Address', align: 'left' },
        {
            key: 'status',
            label: 'Status',
            align: 'start',
            render: (value, row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                    {row.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
            )
        }, 
    ];

    const {
        projects,
        getProjects,
        loading,
        filter,
        error,
        mode,
         setMode,
        createProject,
        updateProject,
        deleteProject,
        uploadProjects,
        setFilters
    } = useProject();

    useEffect(() => {
        getProjects({
            skip: 0,
            take: 10,
            filter: filter
        });
    }, [getProjects]);

    const handleCreate = () => {
        setSelectedProject(null);
        setMode('create');
    };

    const handleEdit = (row) => {
        setSelectedProject(row);
        setMode('edit');
    };

    const handleDelete = (row) => {
        setProjectToDelete(row);
        setMode('delete');
    };

    const confirmDelete = async () => {
        if (projectToDelete) {
            try {
                await deleteProject(projectToDelete.id);
                setProjectToDelete(null);
                setMode(null);
                // Refresh the list
                getProjects({
                    skip: 0,
                    take: 10,
                    filter: filter
                });
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (mode === 'create') {
                await createProject(formData);
            } else if (mode === 'edit') {
                await updateProject({
                    ...formData,
                    id: selectedProject.id
                });
            }

            // Close the modal after successful submission
            setSelectedProject(null);
            setMode(null);

            // Refresh the list
            getProjects({
                skip: 0,
                take: 10,
                filter: filter
            });
        } catch (error) {
            console.error("Error submitting form:", error);
            throw error; // Re-throw to let the form handle it
        }
    };

    const handleUpload = async (data) => {
        try {
            // Upload projects directly
            await uploadProjects(data);

            // Close modal and refresh the list
            setUploadModalOpen(false);
            setMode(null);
            getProjects({
                skip: 0,
                take: 10,
                filter: filter
            });
        } catch (error) {
            console.error("Error uploading projects:", error);
            throw error;
        }
    };

    const handleFilterChange = (status) => {
        console.log('Filter projects by status:', status);
        const newFilter = { ...filter, status };
        setFilters(newFilter);
        getProjects({
            skip: 0,
            take: 10,
            filter: newFilter
        });
    };

    // Create a debounced search function
    const debouncedSearch = useCallback(
        debounceSearch((searchTerm) => {
            console.log('Debounced search projects:', searchTerm);
            const newFilter = { ...filter, search: searchTerm };
            setFilters(newFilter);
            getProjects({
                skip: 0,
                take: 10,
                filter: newFilter
            });
        }, 500),
        [filter, getProjects, setFilters]
    );

    const handleSearchChange = (search) => {
        // Call the debounced search function
        debouncedSearch(search);
    };

    const handleUploadClick = () => {
        setMode('upload');
        setUploadModalOpen(true);
    };

    return (
        <section className="space-y-3">
            <Header
                onAddProject={handleCreate}
                onUploadProjects={handleUploadClick}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
            />

            <div className="px-6">
                {loading ? (
                    <div>Loading projects...</div>
                ) : error ? (
                    <div className="text-red-500">Error: {error?.message || error}</div>
                ) : (
                    <ReusableTable
                        columns={columns}
                        data={projects || []}
                        title="Projects"
                        headerColor="bg-gray-700"
                        headerTextColor="text-white"
                        bordered
                        searchPlaceholder="Search projects..."
                        onAdd={handleCreate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Create/Edit Project Modal */}
            <ProjectFormModal
                open={mode === 'create' || mode === 'edit'}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedProject(null);
                        setMode(null);
                    }
                }}
                onSubmit={handleFormSubmit}
                initialData={selectedProject}
                mode={mode === 'edit' ? 'edit' : 'create'}
            />

            {/* Upload Modal */}
            <UploadModal
                title="Upload Projects"
                description="Upload an Excel file to add multiple projects at once."
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
                requiredColumns={['name', 'projectCode', 'email', 'address (optional)', 'isActive (optional)']}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={mode === 'delete'}
                title="Delete Project"
                description={`Are you sure you want to delete ${projectToDelete?.name}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setProjectToDelete(null);
                    setMode(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
                danger={true}
            />
        </section>
    );
}