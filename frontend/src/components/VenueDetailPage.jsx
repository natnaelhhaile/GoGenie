import React, { useState, useEffect } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa6";
import { IoHeartOutline, IoHeart, IoShareOutline } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import BottomNav from "../components/BottomNav";
import Container from "../components/Container";
import ChatLauncher from "../components/ChatLauncher";
import { useToast } from "../context/ToastContext";
import { isValidVenueId, isValidFeedbackType } from "../utils/validators";
import fallbackImage from "../assets/no-image.jpg";
import "./VenueDetailPage.css";

const FullPageLoader = ({ message = "Loading..." }) => (
  <div className="loading-container">
    <div className="loading-spinner" />
    <p>{message}</p>
  </div>
);

const VenueDetailPage = () => {
  const navigate = useNavigate();
  const { venue_id: paramVenueId } = useParams();
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get("share");
  const isSharedView = !!shareToken;

  const { user } = useAuth();
  const isGuest = !user;
  const { showToast } = useToast();
  const { state } = useLocation();
  const passedVenueId = state?.venue_id;
  const effectiveVenueId = passedVenueId || paramVenueId;

  const guestId =
    localStorage.getItem("guestId") ||
    (() => {
      const id = crypto.randomUUID();
      localStorage.setItem("guestId", id);
      return id;
    })();

  const [venue, setVenue] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState("Loading...");
  const [hours, setHours] = useState("");
  const [openNow, setOpenNow] = useState(null);
  const [popularity, setPopularity] = useState(null);
  const [stats, setStats] = useState({});
  const [tips, setTips] = useState([]);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [priorityScore, setPriorityScore] = useState(null);
  const [scoreBreakdown, setScoreBreakdown] = useState(null);
  const [rsvpStatus, setRsvpStatus] = useState(null);
  const [rsvpCounts, setRsvpCounts] = useState({ yes: 0, no: 0, maybe: 0 });
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPlanner, setIsPlanner] = useState(false);
  const [shared, setIsShared] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [combinedRating, setCombinedRating] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (!isValidVenueId(effectiveVenueId)) {
      showToast("Invalid venue ID", "error");
      navigate("/dashboard");
      return;
    }
    if (shareToken) localStorage.setItem("shareToken", shareToken);

    const fetchVenueDetails = async () => {
      setGlobalLoading(true);
      try {
        const res = await axiosInstance.get(
          `/api/recommendations/details/${effectiveVenueId}`,
          {
            params: {
              ...(shareToken && { share: shareToken }),
              ...(guestId && !user && { guestId }),
            },
          }
        );
        const v = res.data.venue || res.data;
        setVenue(v);
        setRating(v.rating || "N/A");
        setHours(v.hours?.display || v.hours || "Hours not available.");
        setOpenNow(v.hours?.open_now || null);
        setPopularity(v.popularity || null);
        setStats(v.stats || {});
        setTips(v.tips || []);
        setPriorityScore(res.data.priorityScore || null);
        setScoreBreakdown(res.data.scoreBreakdown || null);
        setRsvpStatus(res.data.rsvpStatus || null);
        setRsvpCounts(res.data.rsvpCounts || { yes: 0, no: 0, maybe: 0 });
        setIsPlanner(res.data.isPlanner || false);
        setIsShared(res.data.shared || false);
      } catch (err) {
        console.error("Error fetching venue:", err);
        showToast("Failed to load venue", "error");
        navigate("/dashboard");
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchVenueDetails();
  }, [effectiveVenueId, shareToken, user, guestId, navigate, showToast]);

  // fetch reviews from the backend
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get(`/api/reviews/${venue.venue_id}`);
        setReviews(res.data.reviews);
        setCombinedRating(res.data.avgRating || "No rating available");
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    if (venue?.venue_id) fetchReviews();
  }, [venue]);

  useEffect(() => {
    if (!user || !venue) return;
    axiosInstance
      .get("/api/favorites/is-favorite", {
        params: { venue_id: venue.venue_id },
      })
      .then((res) => setIsFavorite(res.data.isFavorite))
      .catch((err) => console.error("Favorite error:", err));
  }, [venue, user]);

  useEffect(() => {
    if (!user || !venue) return;
    axiosInstance
      .get(`/api/feedback/${venue.venue_id}`)
      .then((res) => {
        if (res.data.feedback === "up") setLiked(true);
        if (res.data.feedback === "down") setDisliked(true);
      })
      .catch((err) => console.error("Feedback error:", err));
  }, [venue, user]);

  const handleToggleFavorite = async () => {
    if (!user)
      return showToast(" ⚠️  Please log in to manage favorites.", "info");
    try {
      const endpoint = isFavorite
        ? "/api/favorites/remove"
        : "/api/favorites/add";
      await axiosInstance.post(endpoint, { venue_id: venue.venue_id });
      setIsFavorite(!isFavorite);
      showToast(isFavorite ? " 💔  Removed" : " ❤️  Added", "success");
    } catch (err) {
      console.error("Favorite toggle error:", err);
      showToast("Failed to update favorite", "error");
    }
  };

  const handleFeedback = async (type) => {
    if (!user) return showToast("⚠️ Please log in to give feedback.", "info");
    if (!isValidFeedbackType(type))
      return showToast("Invalid feedback", "error");
    try {
      await axiosInstance.post("/api/feedback", {
        venue_id: venue.venue_id,
        feedback: type,
      });
      setLiked(type === "up");
      setDisliked(type === "down");
      showToast(
        type === "up" ? "👍 Liked this venue!" : type === "down" ? "👎 Disliked this venue." : "Feedback removed.",
        "success"
      );
    } catch (err) {
      console.error("Feedback error:", err);
      showToast("Error submitting feedback", "error");
    }
  };

  const handleRSVP = async (response) => {
    if (!isValidVenueId(venue?.venue_id))
      return showToast("Invalid venue ID.", "error");
    setRsvpSubmitting(true);
    try {
      const url = user ? "/api/users/rsvp" : "/api/users/rsvp/guest";
      const payload = {
        venue_id: venue.venue_id,
        response,
        ...(user ? { uid: user.uid } : { guestId }),
        ...(shareToken ? { shareToken } : {}),
      };
      await axiosInstance.post(url, payload);
      setRsvpStatus(response);
      showToast(user ? "RSVP sent" : "Guest RSVP sent", "success");
    } catch (err) {
      console.error("RSVP error:", err);
      showToast(user ? "Failed sending RSVP" : "Failed sending guest RSVP", "error");
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (!user) return showToast("Log in to share", "info");
    try {
      const res = await axiosInstance.post("/api/recommendations/share", {
        venue_id: venue.venue_id,
        shared_with_users: [],
      });
      setShareLink(res.data.shareLink);
      setCopied(false);
      showToast("Link ready to copy", "success");
    } catch (err) {
      console.error("Share error:", err);
      showToast("Could not create share link", "error");
    }
  };

  const handleSubmitReview = async () => {
    if (!user) return showToast("⚠️ Please log in to leave a review.", "info");
    setReviewSubmitting(true);
    try {
      const res = await axiosInstance.post("/api/reviews", {
        venue_id: venue.venue_id,
        rating: newRating,
        comment: newReview,
      });
      setReviews([res.data, ...reviews]);
      setNewReview("");
      setNewRating(5);
      showToast("Review submitted!", "success");
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast("Failed to submit review.", "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleHelpfulVote = async (reviewId, index) => {
    try {
      const res = await axiosInstance.post("/api/reviews/helpful", { reviewId });
      const updatedReviews = [...reviews];
      updatedReviews[index].helpfulVotes = [
        ...(updatedReviews[index].helpfulVotes || []),
        user.uid
      ];
      updatedReviews[index].votedHelpful = true; // frontend flag to disable button
      setReviews(updatedReviews);
    } catch (err) {
      showToast("You already marked this as helpful.", "info");
    }
  };

  if (globalLoading || rsvpSubmitting) return <FullPageLoader message={rsvpSubmitting ? "Submitting RSVP..." : "Loading venue..."} />;

  const address =
    venue?.location?.formattedAddress ||
    `${venue?.location?.address}, ${venue?.location?.locality}, ${venue?.location?.region} ${venue?.location?.postcode}` ||
    "Unknown Address";

  const fsqWebUrl = `https://foursquare.com/v/${venue?.name
    .replace(/\s+/g, "-")
    .toLowerCase()}/${venue?.venue_id}`;
  const photos = venue?.photos || [];

  return (
    <Container>
      <div className="venue-detail-container">
        <img
          src={photos[0] || fallbackImage}
          alt={venue.name}
          className="hero-image"
        />
        <div className="venue-header">
          <h2 className="venue-name">{venue.name}</h2>
          {!isGuest && (
            <div className="venue-actions">
              <button onClick={handleToggleFavorite} className="favorite-button">
                {isFavorite ? (
                  <IoHeart className="favorite-icon active" />
                ) : (
                  <IoHeartOutline className="favorite-icon" />
                )}
              </button>
              <button onClick={handleShare} className="favorite-button">
                <IoShareOutline className="favorite-icon" />
              </button>
            </div>
          )}
        </div>
        {shareLink && (
          <div className="share-link-container">
            <input readOnly value={shareLink} className="share-link-input" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                setCopied(true);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        <div className="venue-info">
          <p>
            <span className="label">Address:</span> {address}
          </p>
          <p>
            <span className="label">Categories:</span>{" "}
            {venue.categories?.slice(0, 5).join(", ")}
          </p>
          <p>
            <span className="label">City:</span>{" "}
            {venue.location?.locality || "Unknown"}
          </p>
          <p>
            <span className="label">Status:</span>{" "}
            <span
              className={openNow ? "open-status open" : "open-status closed"}
            >
              {openNow ? "✅ Open Now" : "❌ Closed"}
            </span>
          </p>
          <p>
            <span className="label">Rating:</span>
            <span className="rating-value">⭐ {combinedRating}</span>
          </p>
          <p>
            <span className="label">Popularity:</span>{" "}
            {popularity ? `${(popularity * 100).toFixed(0)}%` : "N/A"}
          </p>
          <p>
            <span className="label">Stats:</span> {stats.total_ratings} ratings,{" "}
            {stats.total_tips} tips, {stats.total_photos} photos
          </p>
          <a
            href={fsqWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="venue-external-link"
          >
            🔗 View on Foursquare
          </a>
          {!isGuest && (
            <div className="icons-row">
              <FaThumbsUp
                className={`thumb-icon ${liked ? "active" : ""}`}
                onClick={() => handleFeedback(liked ? "none" : "up")}
                title="Like"
              />
              <FaThumbsDown
                className={`thumb-icon ${disliked ? "active" : ""}`}
                onClick={() => handleFeedback(disliked ? "none" : "down")}
                title="Dislike"
              />
            </div>
          )}
        </div>

        <div className="section-title">More Photos</div>
        <div className="gallery-scroll">
          {photos.slice(1).map((src, i) => (
            <img key={i} src={src} alt={`Gallery ${i + 1}`} />
          ))}
        </div>

        <div className="section-title">User Tips</div>
        <div className="reviews-section">
          {tips.length > 0 ? (
            tips.map((tip, index) => (
              <div className="tips-card" key={index}>
                <p className="tip-text">"{tip.text}"</p>
                <p className="tip-date">🕒 {new Date(tip.created_at).toLocaleDateString()}</p>
              </div>
            ))
          ) : (
            <p className="no-tips">No tips available yet.</p>
          )}
        </div>

        {/* Reviews section to let users review venue */}
        <div className="section-title">User Reviews</div>
        <div className="reviews-section">
          {reviews.map((review, idx) => (
            <div className="review-card" key={idx}>
              <div className="review-top">
                <span className="review-author">
                  {user && (review.uid === user.uid) ? "Your Rating" : (review.userName)}
                </span>
                <div className="review-stars">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <FaStar
                      key={num}
                      className={`star ${num <= review.rating ? "filled" : ""}`}
                    />
                  ))}
                  <span className="numeric-rating">({review.rating})</span>
                </div>
              </div>
              <p className="review-text">"{review.comment}"</p>
              <p className="review-date">🕒 {new Date(review.createdAt).toLocaleDateString()}</p>
              <button
                  onClick={() => handleHelpfulVote(review._id, idx)}
                  className="helpful-button"
                  disabled={review.votedHelpful || !user}
                >
                  ✅ Helpful ({review.helpfulVotes?.length || 0})
              </button>
            </div>
          ))}


          {/* Review Form */}
          {user && (
            <div className="review-card">
              <div className="review-header">
                <label htmlFor="rating">Your Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <FaStar
                      key={num}
                      className={`star ${num <= (hoverRating || newRating) ? "filled" : ""}`}
                      onMouseEnter={() => setHoverRating(num)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(num)}
                      title={`Rate ${num} star${num > 1 ? "s" : ""}`}
                    />
                  ))}
                </div>
              </div>

              <textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Leave a comment..."
                rows={3}
              />

              <button
                onClick={handleSubmitReview}
                className="submit-review-button"
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}
        </div>


        <div className="section-title">Hours</div>
        <div className="placeholder-box">
          {typeof hours === "string"
            ? hours
                .split(";")
                .map((line, idx) => <div key={idx}>{line.trim()}</div>)
            : "Hours not available."}
        </div>

        {scoreBreakdown && (
          <div className="score-breakdown-container">
            <div className="section-title">Why This Venue?</div>
            <div className="score-box">
              <div className="score-row">
                <span className="score-label">📊&nbsp; Overall:</span>
                <span className="score-value highlight">
                  {(priorityScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="score-row">
                <span className="score-label">🎯&nbsp; Match:</span>
                <span className="score-value">
                  {(scoreBreakdown.similarity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="score-row">
                <span className="score-label">📍&nbsp; Distance:</span>
                <span className="score-value distance">
                  {(scoreBreakdown.proximity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="score-row">
                <span className="score-label">⭐&nbsp; Rating:</span>
                <span className="score-value">
                  {(scoreBreakdown.rating * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {(isSharedView || isPlanner || rsvpStatus) && 
        (<div className="section-title">RSVP</div>)}
        {(isSharedView || isPlanner || rsvpStatus) && (
          <div className="rsvp-section">

          {(isSharedView || rsvpStatus) && (
            <div className="rsvp-response-section">
              {!rsvpStatus ? (
                <>
                  <button onClick={() => handleRSVP("yes")} disabled={loading}>
                    Yes
                  </button>
                  <button onClick={() => handleRSVP("no")} disabled={loading}>
                    No
                  </button>
                  <button onClick={() => handleRSVP("maybe")} disabled={loading}>
                    Maybe
                  </button>
                </>
              ) : (
                <p>
                  You Responded:&nbsp;
                  {rsvpStatus === "yes"
                    ? " 👍 Yes"
                    : rsvpStatus === "no"
                    ? " ❌ No"
                    : " 🤔 Maybe"}
                </p>
              )}
              {loading && (
                <div className="loading-container">
                  <div className="loading-spinner" />
                  <p>Submitting your RSVP request...</p>
                </div>
              )}
            </div>
          )}

            {isPlanner && (
              <p>
                &nbsp;&nbsp; 👍 {rsvpCounts.yes}&nbsp;&nbsp; |&nbsp;&nbsp; ❌ {rsvpCounts.no}&nbsp;&nbsp; |&nbsp;&nbsp; 🤔 {rsvpCounts.maybe}
              </p>
            )}
          </div>
        )}

        {!isGuest && <ChatLauncher isOpen={isChatOpen} setIsOpen={setIsChatOpen} />}
        {!isGuest && <BottomNav />}
      </div>
    </Container>
  );
};

export default VenueDetailPage;
