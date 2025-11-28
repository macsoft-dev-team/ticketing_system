import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CheckCircle,
    AlertCircle,
    X,
    Eye,
    Loader2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const BatchManagerComponent = ({
    currentBatch,
    loadingBatch,
    searchedTicket,
    submitting,
    isTicketInBatch,
    photos,
    addTicketToBatchHandler,
    removeBatchItem,
    clearBatch,
    markAllAsReceived,
    viewTicketImages,
    batchItemPhotos
}) => {
    const requiredPhotos = [
        'Controller Front',
        'Controller Bottom', 
        'Full View Open',
        'MCB Close Up'
    ];

    const hasAllRequiredPhotos = () => {
        if (photos.length < 4) return false;
        return requiredPhotos.every(required => 
            photos.some(photo => photo.label === required)
        );
    };

    const getTicketPhotosCount = (ticketId) => {
        return batchItemPhotos[ticketId]?.length || 0;
    };

    return (
        <div className="space-y-4">
            {/* Selected Ticket Card */}
            {searchedTicket && (
                <Card className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h3 className="font-medium">{searchedTicket.ticketCode}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <div>Controller: {searchedTicket.controllerNumber || 'N/A'}</div>
                                <div>IMEI: {searchedTicket.imei || 'N/A'}</div>
                                <div>Project: {searchedTicket.project?.name || 'N/A'}</div>
                                {searchedTicket.currentMilestone && (
                                    <Badge variant="secondary" size="sm">
                                        {searchedTicket.currentMilestone.stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        
                        {isTicketInBatch(searchedTicket.id) ? (
                            <Badge variant="success" className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                In Batch
                            </Badge>
                        ) : (
                            <Button
                                onClick={addTicketToBatchHandler}
                                disabled={submitting || !hasAllRequiredPhotos()}
                                size="small"
                                className="gap-2"
                            >
                                {submitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                {submitting ? 'Adding...' : 'Add to Batch'}
                            </Button>
                        )}
                    </div>

                    {!hasAllRequiredPhotos() && !isTicketInBatch(searchedTicket.id) && (
                        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span className="text-sm text-orange-700">
                                Please take all 4 required photos before adding to batch
                            </span>
                        </div>
                    )}
                </Card>
            )}

            {/* Current Batch */}
            <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                        Current Batch {currentBatch?.batchNumber ? `#${currentBatch.batchNumber}` : ''}
                        {loadingBatch && <span className="text-sm text-gray-500 ml-2">(Loading...)</span>}
                    </h3>
                    <div className="flex gap-2">
                        {currentBatch?.items?.length > 0 && (
                            <>
                                <Button
                                    onClick={clearBatch}
                                    variant="outline"
                                    size="small"
                                >
                                    Clear
                                </Button>
                                <Button
                                    onClick={markAllAsReceived}
                                    disabled={submitting}
                                    size="small"
                                    className="gap-2"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    {submitting ? 'Processing...' : 'Mark All as Received'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {loadingBatch ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading batch...
                    </div>
                ) : currentBatch?.items?.length > 0 ? (
                    <div className="space-y-2">
                        {currentBatch.items.map((item) => (
                            <div
                                key={item.ticket.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-sm">
                                        {item.ticket.ticketCode}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Controller: {item.ticket.controllerNumber || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        Photos: {getTicketPhotosCount(item.ticket.id)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => viewTicketImages(item.ticket.id)}
                                        variant="ghost"
                                        size="small"
                                        className="gap-1"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </Button>
                                    <Button
                                        onClick={() => removeBatchItem(item.ticket.id)}
                                        variant="ghost"
                                        size="small"
                                        className="p-2 text-red-600 hover:bg-red-50"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-sm">No tickets in current batch</div>
                        <div className="text-xs text-gray-400 mt-1">
                            Search and add tickets to start a batch
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default BatchManagerComponent;