import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { isCatalogLimitError } from "../../api/catalogLimits";
import { isApiError } from "../../api/httpClient";
import type { ResourceApi } from "../../api/resourceApi";
import type { Entitlement, Wardrobe } from "../../api/resourceTypes";
import { putFileToPresignedUrl } from "../../api/uploadToPresignedUrl";
import { useResourceApi } from "../../api/useResourceApi";
import { useWishlistApi } from "../../api/useWishlistApi";
import {
  getMissingAcquireDetails,
  isWishReadyToAcquire,
  loadAllWishes,
  type MissingAcquireDetails,
  type WishItem,
  type WishlistApi,
} from "../../api/wishlistApi";
import { trackEvent } from "../../config/trackingEvents";
import { dashboardCopy } from "../../content/dashboardCopy";
import {
  CATALOG_LIST_QUERY_KEYS,
  invalidateResourceQueries,
} from "../../hooks/resourceQueryCache";
import { useResourceQuery } from "../../hooks/useResourceQuery";
import { CatalogLimitPrompt } from "./CatalogLimitPrompt";
import {
  HorizontalResourceCardItem,
  HorizontalResourceCardList,
} from "./HorizontalResourceCardList";
import { ResourceEmptyState } from "./ResourceEmptyState";
import { ResourceErrorState } from "./ResourceErrorState";
import { WishListAcquireDialog } from "./WishListAcquireDialog";
import { WishListAcquireReadyDialog } from "./WishListAcquireReadyDialog";
import { WishListAddCard } from "./WishListAddCard";
import { WishListCard } from "./WishListCard";
import { WishListDetailDialog } from "./WishListDetailDialog";
import { WishListFormDialog } from "./WishListFormDialog";
import { WishListSkeleton } from "./WishListSkeleton";

export const WISH_LIST_ROW_TEST_ID = "wish-list-row";

export type WishListRowProps = {
  wishlistApi?: WishlistApi;
  resourceApi?: ResourceApi;
  putFile?: typeof putFileToPresignedUrl;
};

type FormState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; wish: WishItem };

export const WishListRow = ({
  wishlistApi: wishlistApiProp,
  resourceApi: resourceApiProp,
  putFile = putFileToPresignedUrl,
}: WishListRowProps) => {
  const defaultWishlistApi = useWishlistApi();
  const defaultResourceApi = useResourceApi();
  const wishlistApi = wishlistApiProp ?? defaultWishlistApi;
  const resourceApi = resourceApiProp ?? defaultResourceApi;
  const copy = dashboardCopy.wishList;
  const loadWishes = useMemo(
    () => () => loadAllWishes(wishlistApi),
    [wishlistApi],
  );
  const query = useResourceQuery(CATALOG_LIST_QUERY_KEYS.wishlist, loadWishes);
  const [formState, setFormState] = useState<FormState>({ open: false });
  const [selectedWish, setSelectedWish] = useState<WishItem | undefined>();
  const [deleteWish, setDeleteWish] = useState<WishItem | undefined>();
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [acquireWish, setAcquireWish] = useState<WishItem | undefined>();
  const [acquireWardrobes, setAcquireWardrobes] = useState<Wardrobe[]>([]);
  const [selectedWardrobeId, setSelectedWardrobeId] = useState("");
  const [acquireError, setAcquireError] = useState<string | undefined>();
  const [itemCapEntitlement, setItemCapEntitlement] = useState<
    Entitlement | undefined
  >();
  const [showItemCap, setShowItemCap] = useState(false);
  const [acquireReadyWish, setAcquireReadyWish] = useState<
    WishItem | undefined
  >();
  const [acquireReadyMissing, setAcquireReadyMissing] = useState<
    MissingAcquireDetails
  >({ category: false, image: false });

  const handleOpenAdd = () => {
    setFormState({ open: true, mode: "create" });
  };

  const handleCloseForm = () => {
    setFormState({ open: false });
  };

  const handleSaved = () => {
    setFormState({ open: false });
    setSelectedWish(undefined);
    invalidateResourceQueries([CATALOG_LIST_QUERY_KEYS.wishlist]);
  };

  const handleOpenWish = (wish: WishItem) => {
    setSelectedWish(wish);
  };

  const handleCloseDetail = () => {
    if (isAcquiring) {
      return;
    }

    setSelectedWish(undefined);
  };

  const handleEditWish = (wish: WishItem) => {
    setSelectedWish(undefined);
    setFormState({ open: true, mode: "edit", wish });
  };

  const handleAskDelete = (wish: WishItem) => {
    setDeleteError(undefined);
    setDeleteWish(wish);
  };

  const handleCloseDelete = () => {
    if (isDeleting) {
      return;
    }

    setDeleteWish(undefined);
    setDeleteError(undefined);
  };

  const handleConfirmDelete = async () => {
    if (!deleteWish) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await wishlistApi.deleteWish(deleteWish.wishId);
      trackEvent("delete_wishlist_item");
      setDeleteWish(undefined);
      setSelectedWish(undefined);
      invalidateResourceQueries([CATALOG_LIST_QUERY_KEYS.wishlist]);
    } catch (error) {
      setDeleteError(
        isApiError(error) ? error.message : copy.deleteErrorFallback,
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowItemCap = async () => {
    try {
      const entitlement = await resourceApi.getMe();
      setItemCapEntitlement(entitlement);
    } catch {
      setItemCapEntitlement(undefined);
    }

    setShowItemCap(true);
  };

  const handleAcquireInWardrobe = async (
    wish: WishItem,
    wardrobeId: string,
  ) => {
    setIsAcquiring(true);
    setAcquireError(undefined);
    try {
      await wishlistApi.acquireWish(wish.wishId, { wardrobeId });
      trackEvent("wishlist_mark_owned");
      setAcquireWish(undefined);
      setSelectedWish(undefined);
      invalidateResourceQueries([
        CATALOG_LIST_QUERY_KEYS.wishlist,
        CATALOG_LIST_QUERY_KEYS.wardrobes,
        CATALOG_LIST_QUERY_KEYS.items,
        CATALOG_LIST_QUERY_KEYS.me,
      ]);
    } catch (error) {
      if (isCatalogLimitError(error)) {
        setAcquireWish(undefined);
        setSelectedWish(undefined);
        await handleShowItemCap();
        return;
      }

      setAcquireError(
        isApiError(error) ? error.message : copy.acquireErrorFallback,
      );
    } finally {
      setIsAcquiring(false);
    }
  };

  const handleAcquireWish = async (wish: WishItem) => {
    setAcquireError(undefined);
    if (!isWishReadyToAcquire(wish)) {
      setSelectedWish(undefined);
      setAcquireReadyMissing(getMissingAcquireDetails(wish));
      setAcquireReadyWish(wish);
      return;
    }

    try {
      const { wardrobes } = await resourceApi.listWardrobes();
      if (wardrobes.length === 1 && wardrobes[0]) {
        await handleAcquireInWardrobe(wish, wardrobes[0].wardrobeId);
        return;
      }

      setAcquireWardrobes(wardrobes);
      setSelectedWardrobeId(wardrobes[0]?.wardrobeId ?? "");
      setSelectedWish(undefined);
      setAcquireWish(wish);
    } catch (error) {
      setAcquireWardrobes([]);
      setSelectedWardrobeId("");
      setSelectedWish(undefined);
      setAcquireWish(wish);
      setAcquireError(
        isApiError(error) ? error.message : copy.acquireErrorFallback,
      );
    }
  };

  const handleCloseAcquire = () => {
    if (isAcquiring) {
      return;
    }

    setAcquireWish(undefined);
    setAcquireError(undefined);
  };

  const handleConfirmAcquire = () => {
    if (!acquireWish) {
      return;
    }

    void handleAcquireInWardrobe(acquireWish, selectedWardrobeId);
  };

  const handleCloseItemCap = () => {
    setShowItemCap(false);
  };

  const handleCloseAcquireReady = () => {
    setAcquireReadyWish(undefined);
  };

  const handleEditAcquireReady = () => {
    if (!acquireReadyWish) {
      return;
    }

    const wish = acquireReadyWish;
    setAcquireReadyWish(undefined);
    setFormState({ open: true, mode: "edit", wish });
  };

  const addButton = (
    <Button
      type="button"
      variant="contained"
      color="primary"
      onClick={handleOpenAdd}
      tabIndex={0}
      aria-label={copy.addAriaLabel}
    >
      {copy.addLabel}
    </Button>
  );

  let body;
  if (query.status === "loading") {
    body = <WishListSkeleton />;
  } else if (query.status === "error") {
    body = (
      <ResourceErrorState
        title={copy.errorTitle}
        description={copy.errorDescription}
        retryLabel={copy.retryLabel}
        onRetry={query.handleRetry}
      />
    );
  } else if (query.data.length === 0) {
    body = (
      <ResourceEmptyState
        title={copy.emptyTitle}
        description={copy.emptyDescription}
      >
        {addButton}
      </ResourceEmptyState>
    );
  } else {
    body = (
      <HorizontalResourceCardList label={copy.title}>
        {query.data.map((wish) => (
          <HorizontalResourceCardItem key={wish.wishId}>
            <WishListCard wish={wish} onOpen={handleOpenWish} />
          </HorizontalResourceCardItem>
        ))}
        <HorizontalResourceCardItem>
          <WishListAddCard onAdd={handleOpenAdd} />
        </HorizontalResourceCardItem>
      </HorizontalResourceCardList>
    );
  }

  return (
    <Stack
      component="section"
      spacing={2}
      aria-labelledby="wish-list-heading"
      data-testid={WISH_LIST_ROW_TEST_ID}
      sx={{ minWidth: 0, width: "100%" }}
    >
      <Stack spacing={0.5}>
        <Typography id="wish-list-heading" variant="h3" component="h2">
          {copy.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {copy.description}
        </Typography>
      </Stack>
      {body}
      {formState.open ? (
        <WishListFormDialog
          key={
            formState.mode === "edit"
              ? `edit:${formState.wish.wishId}`
              : "create"
          }
          open
          mode={formState.mode}
          wish={formState.mode === "edit" ? formState.wish : undefined}
          wishlistApi={wishlistApi}
          putFile={putFile}
          onClose={handleCloseForm}
          onSaved={handleSaved}
        />
      ) : null}
      {selectedWish ? (
        <WishListDetailDialog
          wish={selectedWish}
          isBusy={isAcquiring}
          onClose={handleCloseDetail}
          onEdit={handleEditWish}
          onDelete={handleAskDelete}
          onAcquire={() => {
            void handleAcquireWish(selectedWish);
          }}
        />
      ) : null}
      {deleteWish ? (
        <Dialog
          open
          onClose={handleCloseDelete}
          aria-labelledby="delete-wish-title"
          aria-describedby="delete-wish-description"
        >
          <DialogTitle id="delete-wish-title">
            {copy.deleteConfirmTitle}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2}>
              <Typography id="delete-wish-description" variant="body2">
                {copy.deleteConfirmDescription}
              </Typography>
              {deleteError ? (
                <Typography variant="body2" color="error" role="alert">
                  {deleteError}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              onClick={handleCloseDelete}
              color="secondary"
              tabIndex={0}
              aria-label={copy.cancelLabel}
              disabled={isDeleting}
            >
              {copy.cancelLabel}
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleConfirmDelete();
              }}
              color="error"
              variant="contained"
              tabIndex={0}
              aria-label={copy.deleteConfirmLabel}
              disabled={isDeleting}
            >
              {copy.deleteConfirmLabel}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
      {acquireReadyWish ? (
        <WishListAcquireReadyDialog
          open
          missing={acquireReadyMissing}
          onClose={handleCloseAcquireReady}
          onEdit={handleEditAcquireReady}
        />
      ) : null}
      {acquireWish ? (
        <WishListAcquireDialog
          open
          wardrobes={acquireWardrobes}
          selectedWardrobeId={selectedWardrobeId}
          isBusy={isAcquiring}
          error={acquireError}
          onClose={handleCloseAcquire}
          onWardrobeChange={setSelectedWardrobeId}
          onConfirm={handleConfirmAcquire}
        />
      ) : null}
      {showItemCap ? (
        <Dialog
          open
          onClose={handleCloseItemCap}
          fullWidth
          maxWidth="sm"
          aria-label={dashboardCopy.catalogLimit.item.title}
        >
          <DialogContent>
            <CatalogLimitPrompt
              kind="item"
              limits={itemCapEntitlement?.limits}
              usage={itemCapEntitlement?.usage}
              entitlement={itemCapEntitlement}
            />
          </DialogContent>
          <DialogActions>
            <Button
              type="button"
              color="secondary"
              onClick={handleCloseItemCap}
              tabIndex={0}
              aria-label={copy.closeLabel}
            >
              {copy.closeLabel}
            </Button>
          </DialogActions>
        </Dialog>
      ) : null}
    </Stack>
  );
};
