import importlib
import inspect
import pkgutil
from typing import Dict, Type
from .base import BaseSourcePlugin
import services.sources.plugins as plugins_pkg

class SourceRegistry:
    """
    Registry tự động phát hiện và quản lý các plugin nguồn nội dung.
    """
    _plugins: Dict[str, BaseSourcePlugin] = {}

    @classmethod
    def discover_plugins(cls):
        """Quét thư mục plugins và khởi tạo tất cả các class kế thừa từ BaseSourcePlugin"""
        if cls._plugins:
            return  # Đã load

        for _, module_name, _ in pkgutil.iter_modules(plugins_pkg.__path__):
            full_module_name = f"{plugins_pkg.__name__}.{module_name}"
            module = importlib.import_module(full_module_name)
            
            for name, obj in inspect.getmembers(module):
                if inspect.isclass(obj) and issubclass(obj, BaseSourcePlugin) and obj != BaseSourcePlugin:
                    try:
                        # Khởi tạo plugin
                        plugin_instance = obj()
                        cls._plugins[plugin_instance.id] = plugin_instance
                        print(f"Loaded plugin: {plugin_instance.name} ({plugin_instance.id})")
                    except TypeError as e:
                        print(f"Skipping plugin {name}: {e}")
                    except Exception as e:
                        print(f"Error loading plugin {name}: {e}")

    @classmethod
    def get_plugin(cls, plugin_id: str) -> BaseSourcePlugin:
        return cls._plugins.get(plugin_id)

    @classmethod
    def get_primary(cls) -> BaseSourcePlugin:
        """Lấy plugin có độ ưu tiên cao nhất đang hoạt động"""
        enabled_plugins = [p for p in cls._plugins.values() if p.enabled]
        if not enabled_plugins:
            return None
        return sorted(enabled_plugins, key=lambda p: p.priority)[0]

    @classmethod
    def get_all_enabled(cls) -> list[BaseSourcePlugin]:
        """Lấy tất cả các plugin đang hoạt động"""
        return [p for p in cls._plugins.values() if p.enabled]

    @classmethod
    def get_all_plugins(cls) -> Dict[str, BaseSourcePlugin]:
        return cls._plugins
