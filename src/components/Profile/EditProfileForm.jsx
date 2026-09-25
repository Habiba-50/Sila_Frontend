import { useContext, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { UserContext } from "../../context/UserContext";
import * as userService from "../../services/userService";
import { uploadFileToS3 } from "../../services/uploadService";

const validationSchema = Yup.object({
  username: Yup.string().min(3, "At least 3 characters").required("Required"),
  phone: Yup.string().required("Required"),
});

export default function EditProfileForm({ onDone }) {
  const { userData, refreshProfile } = useContext(UserContext);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const formik = useFormik({
    initialValues: {
      username: userData?.username || "",
      phone: userData?.phone || "",
      bio: userData?.bio || "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await userService.updateProfile(values);

        if (avatarFile) {
          const { data } = await userService.getProfileImageUploadUrl({
            ContentType: avatarFile.type,
            Originalname: avatarFile.name,
          });
          const uploadUrl = data?.data?.url ?? data?.url;
          const key = data?.data?.key ?? data?.key;
          if (uploadUrl) {
            await uploadFileToS3(uploadUrl, avatarFile);
            await userService.confirmProfileImage(key);
          }
        }

        await refreshProfile();
        toast.success("Profile updated");
        onDone?.();
      } catch (error) {
        toast.error(error?.response?.data?.message || "Couldn't save your profile.");
      } finally {
        setSaving(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="bg-panel border border-border rounded-2xl p-5 space-y-4 mb-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Profile photo</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
          className="text-sm"
        />
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
        <button type="button" onClick={onDone} className="text-sm font-medium text-ink-soft px-4 py-2">
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
