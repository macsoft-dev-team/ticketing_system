import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    RefreshCw,
    X,
    Eye,
    Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const CompletedBatchesComponent = ({
    showCompletedBatches,
    setShowCompletedBatches,
    completedBatches,
    loadingCompletedBatches,
    loadCompletedBatches,
    viewTicketImages
}) => {
    return (
        <AnimatePresence>
            {showCompletedBatches && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/25"
                    onClick={() => setShowCompletedBatches(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-4xl max-h-[80vh] bg-white rounded-lg overflow-hidden mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                            <h3 className="font-semibold text-lg">Completed Batches</h3>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={loadCompletedBatches}
                                    disabled={loadingCompletedBatches}
                                    variant="outline"
                                    size="small"
                                    className="gap-2"
                                >
                                    {loadingCompletedBatches ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="w-4 h-4" />
                                    )}
                                    Refresh
                                </Button>
                                <Button
                                    onClick={() => setShowCompletedBatches(false)}
                                    variant="ghost"
                                    size="small"
                                    className="p-2"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        <div className="max-h-[calc(80vh-8rem)] overflow-y-auto p-4">
                            {loadingCompletedBatches ? (
                                <div className="flex items-center justify-center py-8 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Loading completed batches...
                                </div>
                            ) : completedBatches.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <div className="text-sm">No completed batches found</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Completed batches will appear here
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {completedBatches.map((batch) => (
                                        <Card key={batch.id} className="p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="font-medium">
                                                        Batch #{batch.batchNumber}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        Completed: {new Date(batch.completedAt).toLocaleDateString()} at {new Date(batch.completedAt).toLocaleTimeString()}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Items: {batch.items?.length || 0}
                                                    </div>
                                                </div>
                                                <Badge variant="success" size="sm">
                                                    Completed
                                                </Badge>
                                            </div>

                                            {/* Batch Items */}
                                            {batch.items && batch.items.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                                        Tickets in this batch
                                                    </div>
                                                    <div className="grid gap-2">
                                                        {batch.items.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-medium">
                                                                        {item.ticket?.ticketCode}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600">
                                                                        Controller: {item.ticket?.controllerNumber || 'N/A'}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    onClick={() => viewTicketImages(item.ticket?.id)}
                                                                    variant="ghost"
                                                                    size="small"
                                                                    className="gap-1"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    View
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CompletedBatchesComponent;