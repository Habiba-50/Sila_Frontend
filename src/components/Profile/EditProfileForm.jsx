import { useContext, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { UserContext } from "../../context/UserContext";
import * as userService from "../../services/userService";

const validationSchema = Yup.object({
  username: Yup.string().min(3, "At least 3 characters").required("Required"),
  phone: Yup.string().required("Required"),
});

export default function EditProfileForm({ onDone }) {
  const { userData, refreshProfile } = useContext(UserContext);
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverFileNames, setCoverFileNames] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Cover photos upload immediately on selection (the backend takes them
  // directly as multipart, unlike the profile picture's pre-signed-URL flow),
  // so there's no need to wait for "Save changes".
  async function handleCoverChange(e) {
    const selectedFiles = Array.from(e.target.files || []);
    const files = selectedFiles.slice(0, 2);
    if (!files.length) return;
    if (selectedFiles.length > 2) {
      toast.error("Choose up to 2 cover photos.");
    }
    setCoverFileNames(files.map((file) => file.name).join(", "));

    setUploadingCover(true);
    try {
      await userService.uploadCoverImages(files);
      await refreshProfile();
      toast.success("Cover photo updated");
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Couldn't upload the cover photo.",
      );
    } finally {
      setUploadingCover(false);
      e.target.value = ""; // allow re-selecting the same file later
    }
  }

  const formik = useFormik({
    initialValues: {
      username: userData?.username || "",
      phone: userData?.phone || "",
      bio: userData?.bio || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      let savingStep = "profile details";
      try {
        await userService.updateProfile(values);

        if (avatarFile) {
          savingStep = "profile photo upload";
          await userService.uploadProfileImage(avatarFile);
        }

        savingStep = "profile refresh";
        await refreshProfile();
        toast.success("Profile updated");
        onDone?.();
      } catch (error) {
        const serverMessage = error?.response?.data?.message;
        toast.error(
          serverMessage || `Couldn't save your ${savingStep}.`,
        );
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <form
      onSubmit={formik.handleSubmit}
      className="bg-panel border border-border rounded-2xl p-5 space-y-4 mb-5"
    >
      <div>
        <label className="block text-sm font-medium mb-1.5">Cover photo</label>
        <input
          id="profile-cover-input"
          type="file"
          accept="image/*"
          multiple
          disabled={uploadingCover}
          onChange={handleCoverChange}
          className="sr-only"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="profile-cover-input"
            className={`inline-flex items-center bg-primary text-white font-semibold text-sm rounded-lg px-4 py-2 ${uploadingCover ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
          >
            Choose files
          </label>
          <span className="text-sm text-ink-faint truncate">{coverFileNames || "No files chosen"}</span>
        </div>
        {uploadingCover && (
          <p className="text-xs text-ink-faint mt-1">Uploading…</p>
        )}
        <p className="text-xs text-ink-faint mt-1">
          Up to 2 images. Uploads right away.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          Profile photo
        </label>
        <input
          id="profile-photo-input"
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          className="sr-only"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="profile-photo-input" className="inline-flex items-center bg-primary text-white font-semibold text-sm rounded-lg px-4 py-2 cursor-pointer hover:opacity-90">
            Choose file
          </label>
          <span className="text-sm text-ink-faint truncate">{avatarFile?.name || "No file chosen"}</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Name</label>
        <input
          name="username"
          value={formik.values.username}
          onChange={formik.handleChange}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {formik.touched.username && formik.errors.username && (
          <p className="text-like text-xs mt-1">{formik.errors.username}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Phone</label>
        <input
          name="phone"
          value={formik.values.phone}
          onChange={formik.handleChange}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Bio</label>
        <textarea
          name="bio"
          rows={3}
          value={formik.values.bio}
          onChange={formik.handleChange}
          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-medium text-ink-soft px-4 py-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white font-semibold text-sm rounded-lg px-5 py-2 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
